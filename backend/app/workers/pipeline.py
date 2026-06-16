"""End-to-end documentary generation pipeline orchestration."""

from __future__ import annotations

import asyncio
import uuid
from pathlib import Path
from typing import Any

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import logger
from app.db.session import AsyncSessionLocal
from app.models.video_job import JobStatus, VideoJob
from app.schemas.scene import Scene, StoryScript
from app.services.assembly import (
    apply_audio_ducking,
    build_srt_from_elevenlabs,
    burn_subtitles,
    encode_final_21_9,
    insert_transition_sfx,
    render_with_remotion,
)
from app.services.media import (
    animate_still,
    generate_abstract_image,
    lipsync_with_liveportrait,
    refine_with_deepvideo,
    synthesize_narration,
)
from app.services.scrapers import (
    fetch_commons_images,
    fetch_internet_archive,
    fetch_pexels_videos,
    fetch_pixabay_videos,
    fetch_wikipedia_facts,
)
from app.services.storage import upload_final_video


async def _update_status(job_id: uuid.UUID, status: JobStatus, **fields: Any) -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(VideoJob).where(VideoJob.id == job_id))
        job = result.scalar_one()
        job.status = status
        for k, v in fields.items():
            setattr(job, k, v)
        await session.commit()


async def _gather_scene_assets(scene: Scene, *, job_id: uuid.UUID) -> dict[str, Any]:
    """Run all scraping/generation tasks for a single scene in parallel."""
    keyword = " ".join(scene.visual_keywords[:3]) or scene.narration_text[:60]
    bundle: dict[str, Any] = {
        "scene_number": scene.scene_number,
        "narration_text": scene.narration_text,
        "is_abstract_scene": scene.is_abstract_scene,
        "is_historical_character": scene.is_historical_character,
        "character_name": scene.character_name,
        "location_coordinates": [pt.model_dump() for pt in scene.location_coordinates],
    }

    tasks: dict[str, asyncio.Task] = {}

    if scene.is_abstract_scene:
        tasks["abstract_image"] = asyncio.create_task(
            generate_abstract_image(
                prompt=scene.narration_text,
                job_id=job_id,
                scene_number=scene.scene_number,
            )
        )
    else:
        tasks["wikimedia_images"] = asyncio.create_task(fetch_commons_images(keyword))
        tasks["archive_items"] = asyncio.create_task(fetch_internet_archive(keyword))

    tasks["pexels"] = asyncio.create_task(fetch_pexels_videos(keyword))
    tasks["pixabay"] = asyncio.create_task(fetch_pixabay_videos(keyword))

    results: dict[str, Any] = {}
    for key, task in tasks.items():
        try:
            results[key] = await task
        except Exception as exc:  # noqa: BLE001
            logger.warning("Asset fetch failed key={} scene={}: {}", key, scene.scene_number, exc)
            results[key] = None

    bundle.update(results)
    return bundle


async def _generate_narration_assets(
    scene: Scene,
    asset_bundle: dict[str, Any],
    *,
    job_id: uuid.UUID,
) -> None:
    narration = await synthesize_narration(
        text=scene.narration_text,
        job_id=job_id,
        scene_number=scene.scene_number,
    )
    asset_bundle["narration_audio"] = str(narration.audio_path)
    asset_bundle["narration_alignment"] = narration.timestamps_json

    if scene.is_abstract_scene and asset_bundle.get("abstract_image"):
        clip = await animate_still(
            image_url=Path(asset_bundle["abstract_image"]).as_uri(),
            prompt=scene.narration_text,
            job_id=job_id,
            scene_number=scene.scene_number,
        )
        asset_bundle["animated_clip"] = str(clip)

    if scene.is_historical_character and scene.character_name:
        commons = asset_bundle.get("wikimedia_images") or []
        portrait_url = commons[0]["url"] if commons else None
        if portrait_url:
            portrait_path = settings.storage_root / str(job_id) / "portraits" / (
                f"scene-{scene.scene_number:03d}.png"
            )
            portrait_path.parent.mkdir(parents=True, exist_ok=True)
            import httpx

            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(portrait_url)
                resp.raise_for_status()
                portrait_path.write_bytes(resp.content)

            lp_clip = await lipsync_with_liveportrait(
                portrait_path=portrait_path,
                audio_path=narration.audio_path,
                job_id=job_id,
                scene_number=scene.scene_number,
            )
            refined = await refine_with_deepvideo(
                video_path=lp_clip,
                character_name=scene.character_name,
                job_id=job_id,
                scene_number=scene.scene_number,
            )
            asset_bundle["character_clip"] = str(refined)


async def _gather_topic_facts(script: StoryScript) -> dict[str, Any]:
    return await fetch_wikipedia_facts(script.topic, language=script.language)


async def _build_manifest(
    *, job_id: uuid.UUID, script: StoryScript
) -> dict[str, Any]:
    facts = await _gather_topic_facts(script)
    scene_bundles = [await _gather_scene_assets(s, job_id=job_id) for s in script.scenes]

    await asyncio.gather(
        *[
            _generate_narration_assets(scene, bundle, job_id=job_id)
            for scene, bundle in zip(script.scenes, scene_bundles, strict=True)
        ]
    )

    return {
        "job_id": str(job_id),
        "topic": script.topic,
        "language": script.language,
        "model": script.model,
        "facts": facts,
        "mapbox_token": settings.mapbox_token,
        "aspect_ratio": settings.output_aspect_ratio,
        "fps": settings.output_fps,
        "scenes": scene_bundles,
    }


def _flatten_alignment(scene_bundles: list[dict[str, Any]]) -> dict[str, Any]:
    """Stitch per-scene ElevenLabs alignments into a global timeline."""
    out_chars: list[str] = []
    out_starts: list[float] = []
    out_ends: list[float] = []
    offset = 0.0
    for bundle in scene_bundles:
        align = bundle.get("narration_alignment") or {}
        chars = align.get("characters", [])
        starts = align.get("character_start_times_seconds", [])
        ends = align.get("character_end_times_seconds", [])
        if not chars:
            continue
        out_chars.extend(chars)
        out_starts.extend(s + offset for s in starts)
        out_ends.extend(e + offset for e in ends)
        if ends:
            offset += ends[-1] + 0.3
    return {
        "characters": out_chars,
        "character_start_times_seconds": out_starts,
        "character_end_times_seconds": out_ends,
    }


async def run_full_pipeline(job_id: uuid.UUID) -> None:
    """Run the full pipeline. Each phase updates the job status atomically."""
    async with AsyncSessionLocal() as session:
        job = (await session.execute(select(VideoJob).where(VideoJob.id == job_id))).scalar_one()
        story_json = job.story_json
    if not story_json:
        raise RuntimeError(f"Job {job_id} has no story_json. Run /api/generate-story first.")

    script = StoryScript.model_validate(story_json)
    try:
        await _update_status(job_id, JobStatus.scraping)
        manifest = await _build_manifest(job_id=job_id, script=script)

        await _update_status(job_id, JobStatus.assembling, asset_manifest=manifest)
        remotion_out = render_with_remotion(manifest=manifest, job_id=job_id)

        srt_path = settings.storage_root / str(job_id) / "subtitles.srt"
        build_srt_from_elevenlabs(
            alignment=_flatten_alignment(manifest["scenes"]),
            output_path=srt_path,
        )
        subbed = burn_subtitles(
            video_in=remotion_out,
            srt_path=srt_path,
            output_path=settings.storage_root / str(job_id) / "subbed.mp4",
        )

        sfx_path = Path(__file__).resolve().parents[1] / "assets" / "whoosh.mp3"
        transition_points = [
            sum(
                (s.duration_seconds or 10) for s in script.scenes[:idx]
            )
            for idx in range(1, len(script.scenes))
        ]
        with_sfx = (
            insert_transition_sfx(
                video_in=subbed,
                transition_points_seconds=transition_points,
                sfx_path=sfx_path,
                output_path=settings.storage_root / str(job_id) / "with-sfx.mp4",
            )
            if sfx_path.exists()
            else subbed
        )

        music_path = Path(__file__).resolve().parents[1] / "assets" / "background.mp3"
        voice_master = settings.storage_root / str(job_id) / "voice-master.mp3"
        if music_path.exists() and voice_master.exists():
            mixed_audio = apply_audio_ducking(
                voice_track=voice_master,
                music_track=music_path,
                output_path=settings.storage_root / str(job_id) / "mixed.aac",
            )
            logger.debug("Ducked audio: {}", mixed_audio)

        await _update_status(job_id, JobStatus.encoding)
        final_path = encode_final_21_9(
            video_in=with_sfx,
            output_path=settings.storage_root / str(job_id) / "final.mp4",
        )

        public_url = upload_final_video(job_id=job_id, local_path=final_path)
        await _update_status(job_id, JobStatus.completed, output_url=public_url)
        logger.info("Job {} complete: {}", job_id, public_url)

    except Exception as exc:  # noqa: BLE001
        logger.exception("Pipeline failed for job {}", job_id)
        await _update_status(job_id, JobStatus.failed, error_message=str(exc))
        raise
