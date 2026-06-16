"""Celery application factory."""

from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery = Celery(
    "docugen",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery.conf.update(
    task_acks_late=True,
    task_default_queue="docugen-default",
    worker_prefetch_multiplier=1,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
)
