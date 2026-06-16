"""End-to-end documentary generation pipeline.

This is the orchestration brain executed by the background worker. It walks a
:class:`Video` through every stage and persists progress to Supabase so the
dashboard can show a live status.

Stages:
  1. scripting          (already done at request time, stored on the video)
  2. verifiable facts   (Wikipedia/Wikidata)
  3. media scraping     (Wikimedia, Internet Archive, Pexels, Pixabay, Flux)
  4. narration          (ElevenLabs + word timestamps)
  5. character/motion   (LivePortrait -> DeepVideo-V1, or Wan2.1)
  6. assembly + render  (Remotion + Motion.dev + FFmpeg ducking/SFX, 21:9 MP4)
"""

from __future__ import annotations

from app.config import settings
from app.core.logging import logger
from app.core.supabase_client import get_supabase_admin
from app.models.video import Scene, Video, VideoStatus
from app.services import storage
from app.services.ai import character_engine
from app.services.assembly import remotion
from app.services.audio import elevenlabs
from app.services.scraper import media_fetcher


def _update_status(video_id: str, status: VideoStatus, progress: int) -> None:
    try:
        get_supabase_admin().table("videos").update(
            {"status": status.value, "progress": progress}
        ).eq("id", video_id).execute()
    except Exception as exc:  # pragma: no cover - status is best-effort
        logger.warning("Failed to persist status for {}: {}", video_id, exc)


def _persist_scene(video_id: str, scene: Scene) -> None:
    try:
        get_supabase_admin().table("scenes").upsert(
            {
                "video_id": video_id,
                "scene_number": scene.scene_number,
                "narration_text": scene.narration_text,
                "audio_url": scene.audio_url,
                "clip_url": scene.clip_url,
                "media_assets": scene.media_assets,
                "word_timestamps": scene.word_timestamps,
            },
            on_conflict="video_id,scene_number",
        ).execute()
    except Exception as exc:  # pragma: no cover
        logger.warning("Failed to persist scene {}: {}", scene.scene_number, exc)


async def run_pipeline(video: Video) -> Video:
    """Execute the full generation pipeline for a video."""
    logger.info("Pipeline start: video={} topic='{}'", video.id, video.topic)
    total = max(len(video.scenes), 1)

    # 2. Verifiable facts (grounding context for the whole doc).
    _update_status(video.id, VideoStatus.SCRAPING, 10)
    facts = await media_fetcher.fetch_verifiable_facts(video.topic)
    logger.info("Grounded with {} facts", len(facts.get("facts", [])))

    # 3-5. Per-scene media + narration + cinematics.
    for index, scene in enumerate(video.scenes):
        base = 15 + int((index / total) * 70)

        _update_status(video.id, VideoStatus.GENERATING_MEDIA, base)
        await media_fetcher.fetch_scene_media(scene, topic=video.topic)

        _update_status(video.id, VideoStatus.SYNTHESISING, base + 3)
        try:
            narration = await elevenlabs.synthesize(scene.narration_text)
            scene.audio_url = narration["audio_url"]
            scene.word_timestamps = narration["word_timestamps"]
            audio_path = narration["audio_path"]
        except Exception as exc:
            logger.warning("Narration failed for scene {}: {}", scene.scene_number, exc)
            audio_path = None

        if audio_path:
            try:
                clip = await character_engine.synthesize_scene_clip(
                    scene, audio_path=audio_path
                )
                if clip:
                    scene.clip_url = clip["url"]
            except Exception as exc:
                logger.warning("Cinematics failed for scene {}: {}", scene.scene_number, exc)

        _persist_scene(video.id, scene)

    # 6. Assembly + render.
    _update_status(video.id, VideoStatus.RENDERING, 90)
    try:
        out_path = await remotion.render(video, mapbox_token=settings.mapbox_access_token)
        video.output_url = storage.public_url(out_path)
        video.status = VideoStatus.COMPLETED
        _update_status(video.id, VideoStatus.COMPLETED, 100)
        get_supabase_admin().table("videos").update(
            {"output_url": video.output_url}
        ).eq("id", video.id).execute()
    except Exception as exc:
        logger.exception("Render failed for video {}", video.id)
        video.status = VideoStatus.FAILED
        video.error = str(exc)
        get_supabase_admin().table("videos").update(
            {"status": VideoStatus.FAILED.value, "error": str(exc)}
        ).eq("id", video.id).execute()

    logger.info("Pipeline finished: video={} status={}", video.id, video.status)
    return video
