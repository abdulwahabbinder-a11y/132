"""Celery task entry-points."""

from __future__ import annotations

import asyncio
import uuid

from app.core.logging import configure_logging, logger
from app.workers.celery_app import celery
from app.workers.pipeline import run_full_pipeline

configure_logging()


@celery.task(
    name="docugen.pipeline.run",
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 1, "countdown": 30},
    soft_time_limit=60 * 60,
    time_limit=60 * 60 + 60,
)
def run_pipeline_task(self, job_id: str) -> str:
    logger.info("Pipeline task started: job_id={}", job_id)
    asyncio.run(run_full_pipeline(uuid.UUID(job_id)))
    return job_id
