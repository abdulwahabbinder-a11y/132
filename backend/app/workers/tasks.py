"""Celery tasks: the asynchronous generation worker."""

from __future__ import annotations

import asyncio

from app.core.logging import logger
from app.models.video import Video
from app.services.pipeline import run_pipeline
from app.workers.celery_app import celery_app


@celery_app.task(name="docuforge.generate_video", bind=True, max_retries=1)
def generate_video_task(self, video_payload: dict) -> dict:
    """Background task that runs the full documentary pipeline.

    ``video_payload`` is a serialised :class:`Video` (including its scenes), so the
    worker is self-contained and does not depend on request state.
    """
    video = Video(**video_payload)
    logger.info("Worker picked up video {} (task {})", video.id, self.request.id)
    result = asyncio.run(run_pipeline(video))
    return result.model_dump(mode="json")
