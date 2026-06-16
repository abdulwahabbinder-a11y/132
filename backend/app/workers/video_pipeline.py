"""End-to-end async pipeline that turns a scripted scene list into a
finished 21:9 cinematic MP4.

Stages
------
1. SCRAPING        — Wikipedia facts, Wikimedia photos, Internet Archive,
                     Pexels/Pixabay B-roll. Flux still for abstract scenes.
2. VOICEOVER       — ElevenLabs per-scene MP3 + char/word timestamps.
3. ANIMATION       — Wan2.1 animates stills → 4s clips.
                     LivePortrait + DeepVideo-V1 for historical characters.
4. COMPOSITION     — Remotion (with Motion.dev props) for scene orchestration
                     and animated map sequences.
5. POST            — FFmpeg audio ducking, transition SFX, ASS subtitle
                     burn-in, 21:9 export. Upload to storage and persist URL.
"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Dict, List

from loguru import logger

from app.config import settings
from app.database import supabase_admin
from app.schemas.story import Scene, Script
from app.services.ai_media import deepvideo, flux, wan21
from app.services.maps.mapbox import build_camera_path
from app.services.scraper import internet_archive, pexels, pixabay, wikimedia, wikipedia
from app.services.tts.elevenlabs import synthesize
from app.services.video import ffmpeg_processor, remotion_renderer
from app.services.video.subtitles import write_ass
from app.workers.celery_app import celery_app


# ----------------------------------------------------------------- helpers ---


def _work_dir(video_id: str) -> Path:
    base = Path("backend/storage") / video_id
    base.mkdir(parents=True, exist_ok=True)
    return base


def _update_progress(video_id: str, *, status: str | None = None,
                     pct: int | None = None, **extra) -> None:
    patch: dict[str, Any] = dict(extra)
    if status is not None:
        patch["status"] = status
    if pct is not None:
        patch["progress_pct"] = pct
    if patch:
        supabase_admin().table("videos").update(patch).eq("id", video_id).execute()


# ------------------------------------------------------------ stage runners ---


async def _scrape_scene(scene: Scene, *, topic: str) -> Dict[str, Any]:
    """Collect every visual asset for one scene from public sources."""
    bundle: dict[str, Any] = {
        "scene_number": scene.scene_number,
        "wiki_facts": [],
        "image_urls": [],
        "background_video_urls": [],
        "abstract_image_url": None,
    }

    queries = scene.visual_keywords or [topic]
    primary_q = queries[0]

    # Verifiable facts (cheap, single call per scene)
    bundle["wiki_facts"] = await wikipedia.get_facts(primary_q, limit=3)

    if scene.is_abstract_scene:
        return bundle  # Flux is scheduled separately (needs GPU budget).

    # Historical & concrete sources fan-out
    archival, stock_pexels, stock_pixabay, commons = await asyncio.gather(
        internet_archive.search(primary_q, media_type="image", limit=4),
        pexels.search_videos(primary_q, per_page=3),
        pixabay.search_videos(primary_q, per_page=3),
        wikimedia.search_images(primary_q, limit=4),
        return_exceptions=True,
    )

    def _safe(x):
        return x if isinstance(x, list) else []

    bundle["image_urls"] = [a["url"] for a in _safe(commons) + _safe(archival) if a.get("url")]
    bundle["background_video_urls"] = [
        v["url"] for v in _safe(stock_pexels) + _safe(stock_pixabay) if v.get("url")
    ]
    return bundle


async def _voiceover_scene(scene: Scene, work_dir: Path) -> dict[str, Any]:
    mp3 = work_dir / f"scene_{scene.scene_number:02d}.mp3"
    result = await synthesize(text=scene.narration_text, out_path=mp3)
    return {
        "scene_number": scene.scene_number,
        "narration_audio_path": str(result.mp3_path),
        "word_timestamps": result.word_timestamps,
    }


async def _generate_visuals(scene: Scene, bundle: dict, work_dir: Path) -> dict:
    """Run Flux (abstract) / Wan2.1 (animate stills) / character pipeline."""
    if scene.is_abstract_scene:
        still = work_dir / f"scene_{scene.scene_number:02d}_flux.png"
        await flux.generate_image(
            prompt=" ".join(scene.visual_keywords) or scene.narration_text[:140],
            out_path=still,
        )
        clip = work_dir / f"scene_{scene.scene_number:02d}_wan21.mp4"
        await wan21.animate_image(
            image_path=still,
            motion_prompt=scene.narration_text[:140],
            out_path=clip,
        )
        bundle["abstract_image_url"] = str(still)
        bundle["animated_clip_url"] = str(clip)

    elif scene.is_historical_character and bundle.get("image_urls"):
        # Use the first archival photo as the source portrait.
        portrait = Path(bundle["image_urls"][0])
        audio = Path(bundle.get("narration_audio_path", ""))
        if portrait.exists() and audio.exists():
            character_clip = await deepvideo.render_character_scene(
                portrait_path=portrait,
                audio_path=audio,
                work_dir=work_dir,
                scene_number=scene.scene_number,
            )
            bundle["character_clip_url"] = str(character_clip)

    return bundle


# ------------------------------------------------------------- entry point ---


async def _pipeline_async(video_id: str) -> None:
    sb = supabase_admin()
    row = sb.table("videos").select("*").eq("id", video_id).single().execute().data
    script = Script.model_validate(row["script_json"])
    work_dir = _work_dir(video_id)

    # === STAGE 1: SCRAPE =====================================================
    _update_progress(video_id, status="scraping", pct=15)
    asset_bundles = await asyncio.gather(*[
        _scrape_scene(s, topic=script.topic) for s in script.scenes
    ])

    # === STAGE 2: VOICEOVER ==================================================
    _update_progress(video_id, status="rendering", pct=35)
    voice_chunks = await asyncio.gather(*[
        _voiceover_scene(s, work_dir) for s in script.scenes
    ])
    for b, v in zip(asset_bundles, voice_chunks):
        b.update(v)

    # === STAGE 3: VISUAL GENERATION ==========================================
    _update_progress(video_id, status="rendering", pct=55)
    asset_bundles = await asyncio.gather(*[
        _generate_visuals(s, b, work_dir)
        for s, b in zip(script.scenes, asset_bundles)
    ])

    sb.table("videos").update({"assets_json": asset_bundles}).eq("id", video_id).execute()

    # === STAGE 4: REMOTION COMPOSITION =======================================
    _update_progress(video_id, status="composing", pct=75)

    coords = [tuple(s.location_coordinates) for s in script.scenes if s.location_coordinates]
    composition_props = {
        "title": script.title,
        "scenes": [
            {
                "scene_number": s.scene_number,
                "narration_text": s.narration_text,
                "narration_audio_url": b.get("narration_audio_path"),
                "word_timestamps": b.get("word_timestamps", []),
                "background_video_urls": b.get("background_video_urls", []),
                "image_urls": b.get("image_urls", []),
                "animated_clip_url": b.get("animated_clip_url"),
                "character_clip_url": b.get("character_clip_url"),
                "abstract_image_url": b.get("abstract_image_url"),
                "is_abstract_scene": s.is_abstract_scene,
                "is_historical_character": s.is_historical_character,
                "character_name": s.character_name,
                "location_coordinates": s.location_coordinates,
            }
            for s, b in zip(script.scenes, asset_bundles)
        ],
        "map_path": build_camera_path(coords),
        "mapbox_token": settings.mapbox_access_token,
    }
    pre_master = work_dir / "remotion_master.mp4"
    await remotion_renderer.render(
        composition_id="DocumentaryComposition",
        props=composition_props,
        out_path=pre_master,
    )

    # === STAGE 5: FFMPEG POST ================================================
    _update_progress(video_id, status="composing", pct=88)

    # Combine ducked music + narration if a global music bed exists
    music_bed = Path("backend/assets/music/cinematic_doc_bed.mp3")
    narration_concat = work_dir / "narration_full.mp3"
    if all(Path(v["narration_audio_path"]).exists() for v in voice_chunks):
        await ffmpeg_processor.concat_clips(
            [Path(v["narration_audio_path"]) for v in voice_chunks], narration_concat
        )

    if music_bed.exists() and narration_concat.exists():
        ducked = work_dir / "audio_master.mp3"
        await ffmpeg_processor.duck_music_under_narration(
            music_path=music_bed,
            narration_path=narration_concat,
            out_path=ducked,
        )

    # Subtitles
    flat_words: List[dict] = []
    offset = 0.0
    for v in voice_chunks:
        flat_words.extend(
            {"word": w["word"], "start_s": w["start_s"] + offset, "end_s": w["end_s"] + offset}
            for w in v["word_timestamps"]
        )
        offset += (v["word_timestamps"][-1]["end_s"] if v["word_timestamps"] else 0)

    subs = write_ass(word_timestamps=flat_words, out_path=work_dir / "subs.ass")

    # Transition SFX
    sfx = Path("backend/assets/sfx/whoosh.mp3")
    if sfx.exists():
        with_sfx = work_dir / "with_sfx.mp4"
        timestamps = [v["word_timestamps"][0]["start_s"] for v in voice_chunks if v["word_timestamps"]]
        await ffmpeg_processor.insert_transition_sfx(
            base_video_path=pre_master,
            sfx_path=sfx,
            timestamps_s=timestamps,
            out_path=with_sfx,
        )
        pre_master = with_sfx

    # Final 21:9 export
    final = work_dir / "final_21x9.mp4"
    await ffmpeg_processor.burn_subtitles_and_export_cinematic(
        video_path=pre_master,
        ass_subtitle_path=subs,
        out_path=final,
    )
    duration = await ffmpeg_processor.probe_duration(final)

    # TODO(upload): push `final` to Supabase Storage / S3, get a public CDN URL.
    output_url = f"/storage/{video_id}/final_21x9.mp4"

    _update_progress(
        video_id,
        status="completed",
        pct=100,
        output_url=output_url,
        duration_seconds=int(duration),
    )
    logger.info("Video {} completed ({}s)", video_id, int(duration))


# ------------------------------------------------------ Celery task wrapper ---


@celery_app.task(name="video.build", bind=True, max_retries=2, default_retry_delay=30)
def build_video_task(self, video_id: str) -> dict:
    """Sync Celery entrypoint; runs the async pipeline to completion."""
    try:
        asyncio.run(_pipeline_async(video_id))
        return {"video_id": video_id, "status": "completed"}
    except Exception as exc:
        logger.exception("Pipeline failed for video {}", video_id)
        _update_progress(video_id, status="failed", error_message=str(exc))
        raise self.retry(exc=exc) from exc
