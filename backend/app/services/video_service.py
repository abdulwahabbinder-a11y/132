"""Video record persistence + worker dispatch."""

from __future__ import annotations

from app.core.logging import logger
from app.core.supabase_client import get_supabase_admin
from app.models.video import Video, VideoStatus
from app.schemas.story import StoryScript


def create_video_record(*, user_id: str, topic: str, script: StoryScript) -> Video:
    """Persist a new video + its scenes and return the domain model."""
    video = Video(
        user_id=user_id,
        topic=topic,
        language=script.language.value,
        status=VideoStatus.QUEUED,
        scenes=script.scenes,
    )

    db = get_supabase_admin()
    resp = (
        db.table("videos")
        .insert(
            {
                "user_id": user_id,
                "topic": topic,
                "language": script.language.value,
                "status": VideoStatus.QUEUED.value,
                "progress": 0,
            }
        )
        .execute()
    )
    video.id = resp.data[0]["id"]

    scene_rows = [
        {
            "video_id": video.id,
            "scene_number": s.scene_number,
            "narration_text": s.narration_text,
            "visual_keywords": s.visual_keywords,
            "is_abstract_scene": s.is_abstract_scene,
            "is_historical_character": s.is_historical_character,
            "character_name": s.character_name,
            "location_coordinates": s.location_coordinates,
        }
        for s in script.scenes
    ]
    if scene_rows:
        db.table("scenes").insert(scene_rows).execute()

    logger.info("Created video {} with {} scenes", video.id, len(script.scenes))
    return video


def enqueue_generation(video: Video) -> None:
    """Dispatch the heavy generation pipeline to the Celery worker."""
    # Imported lazily so the API can boot without a broker connection.
    from app.workers.tasks import generate_video_task

    generate_video_task.delay(video.model_dump(mode="json"))
    logger.info("Enqueued generation for video {}", video.id)
