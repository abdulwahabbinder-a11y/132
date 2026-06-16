import logging

from celery import Celery

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

celery_app = Celery(
    "docuforge",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(name="enqueue_video_pipeline", bind=True, max_retries=2)
def enqueue_video_pipeline(self, job_id: str):
    from app.services.asset_worker import run_video_pipeline

    logger.info("Starting video pipeline for job %s", job_id)
    try:
        result = run_video_pipeline(job_id)
        logger.info("Pipeline completed for job %s", job_id)
        return result
    except Exception as exc:
        logger.exception("Pipeline failed for job %s, retrying", job_id)
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(name="enqueue_short_pipeline", bind=True, max_retries=2)
def enqueue_short_pipeline(self, job_id: str, topic: str, target_duration_seconds: int = 60):
    from app.services.short_pipeline import run_short_pipeline

    logger.info("Starting viral short pipeline for job %s", job_id)
    try:
        result = run_short_pipeline(job_id, topic, target_duration_seconds)
        logger.info("Short pipeline completed for job %s", job_id)
        return result
    except Exception as exc:
        logger.exception("Short pipeline failed for job %s", job_id)
        raise self.retry(exc=exc, countdown=30)
