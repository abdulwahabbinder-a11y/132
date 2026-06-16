"""Celery app — long-running media pipeline runs out-of-band from the API."""

from celery import Celery

from app.config import settings

celery_app = Celery(
    "documentary_worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.video_pipeline"],
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
    task_time_limit=60 * 60,   # 1 h hard cap per video
    task_soft_time_limit=55 * 60,
)
