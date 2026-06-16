"""Celery application factory."""

from __future__ import annotations

from celery import Celery

from app.config import settings
from app.core.logging import configure_logging

configure_logging()

celery_app = Celery(
    "docuforge",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_time_limit=60 * 60,  # hard limit: 1 hour per render
    task_soft_time_limit=55 * 60,
    worker_max_tasks_per_child=20,
    broker_connection_retry_on_startup=True,
)
