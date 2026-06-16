import json
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.job import GenerationJob, JobStatus
from app.schemas.story import DocumentaryScene
from app.services.facts import HistoricalFactService
from app.services.media import SceneMediaService
from app.services.tts import ElevenLabsNarrationService
from app.services.video import VideoAssemblyService

settings = get_settings()


def build_word_timestamps(narration_text: str, alignment: dict) -> list[dict]:
    starts = alignment.get("character_start_times_seconds", [])
    ends = alignment.get("character_end_times_seconds", [])
    words: list[dict] = []
    cursor = 0

    for token in narration_text.split():
        token_length = len(token)
        start = starts[cursor] if cursor < len(starts) else 0
        end_index = min(cursor + token_length - 1, len(ends) - 1)
        end = ends[end_index] if end_index >= 0 else start
        words.append({"text": token, "start": start, "end": end})
        cursor += token_length + 1

    return words


async def update_job_status(job_id, status_value: JobStatus, **extra_updates) -> GenerationJob:
    async with SessionLocal() as session:
        result = await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))
        job = result.scalar_one()
        job.status = status_value
        for key, value in extra_updates.items():
            setattr(job, key, value)
        await session.commit()
        return job


async def run_generation_pipeline(job_id) -> None:
    facts_service = HistoricalFactService()
    media_service = SceneMediaService()
    narration_service = ElevenLabsNarrationService()
    video_service = VideoAssemblyService()

    async with SessionLocal() as session:
        result = await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))
        job = result.scalar_one()
        story = [DocumentaryScene.model_validate(item) for item in job.story_json["story"]]

    job_dir = Path(settings.media_storage_root_abs) / str(job_id)
    facts_manifest: list[dict] = []
    scene_assets: list[dict] = []
    subtitles: list[dict] = []
    remotion_scenes: list[dict] = []

    try:
        await update_job_status(job_id, JobStatus.gathering_facts)
        for scene in story:
            facts_manifest.append(await facts_service.enrich_scene(scene, job.topic))

        await update_job_status(job_id, JobStatus.downloading_assets)
        for scene in story:
            scene_asset = await media_service.collect_assets_for_scene(scene, job.topic, job_dir)
            scene_assets.append({"scene_number": scene.scene_number, **scene_asset})

        await update_job_status(job_id, JobStatus.synthesizing_audio)
        for scene in story:
            scene_dir = job_dir / f"scene-{scene.scene_number:02d}"
            tts_result = await narration_service.synthesize_with_timestamps(scene.narration_text, scene_dir)
            word_timestamps = build_word_timestamps(scene.narration_text, tts_result)
            subtitles.append({"scene_number": scene.scene_number, "words": word_timestamps})

            matching_assets = next(
                asset for asset in scene_assets if asset["scene_number"] == scene.scene_number
            )
            primary_image = None
            if matching_assets.get("generated"):
                primary_image = matching_assets["generated"]["local_path"]
            elif matching_assets.get("archival"):
                primary_image = matching_assets["archival"][0]["local_path"]

            clip_descriptor: dict
            if scene.is_historical_character and primary_image:
                await update_job_status(job_id, JobStatus.animating_scenes)
                lip_sync = await video_service.run_liveportrait(
                    image_path=primary_image,
                    audio_path=tts_result["audio_path"],
                    destination_dir=scene_dir / "liveportrait",
                )
                clip_descriptor = await video_service.run_deepvideo_character_render(
                    source_clip_path=lip_sync["clip_path"],
                    destination_dir=scene_dir / "deepvideo",
                )
            elif primary_image:
                await update_job_status(job_id, JobStatus.animating_scenes)
                clip_descriptor = await video_service.animate_static_image(
                    image_path=primary_image,
                    prompt=scene.narration_text,
                    destination_dir=scene_dir / "wan",
                )
            else:
                stock_videos = matching_assets.get("stock_video", [])
                clip_descriptor = stock_videos[0] if stock_videos else {"clip_path": None}

            remotion_scenes.append(
                {
                    "sceneNumber": scene.scene_number,
                    "narrationText": scene.narration_text,
                    "visualKeywords": scene.visual_keywords,
                    "clipPath": clip_descriptor.get("clip_path") or clip_descriptor.get("local_path"),
                    "mapCoordinates": (
                        scene.location_coordinates.model_dump()
                        if scene.location_coordinates
                        else None
                    ),
                    "subtitles": word_timestamps,
                }
            )

        await update_job_status(job_id, JobStatus.rendering_video)
        manifest_path = job_dir / "render-manifest.json"
        output_path = job_dir / "final-documentary.mp4"
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(
            json.dumps(
                {
                    "id": str(job_id),
                    "aspectRatio": "21:9",
                    "fps": settings.remotion_fps,
                    "scenes": remotion_scenes,
                },
                indent=2,
            )
        )
        render_url = await video_service.render_with_remotion(manifest_path, output_path)

        await update_job_status(
            job_id,
            JobStatus.completed,
            asset_manifest={
                "facts": facts_manifest,
                "scene_assets": scene_assets,
            },
            subtitles_json={"scenes": subtitles},
            render_url=render_url,
            completed_at=datetime.now(UTC),
            error_message=None,
        )
    except Exception as exc:  # noqa: BLE001
        await update_job_status(job_id, JobStatus.failed, error_message=str(exc))
