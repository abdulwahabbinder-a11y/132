"""Celery task entrypoints wrapping the async pipeline."""

from __future__ import annotations

import asyncio

from app.core.logging import get_logger
from app.services import jobs as job_service
from app.services import subscriptions as sub_service
from app.workers.celery_app import celery_app
from app.workers.pipeline import run_pipeline

log = get_logger(__name__)


@celery_app.task(name="generate_documentary", bind=True, max_retries=1)
def generate_documentary(self, job_id: str, user_id: str) -> dict:
    """Run the full documentary pipeline for a job; refund credit on failure."""
    try:
        return asyncio.run(run_pipeline(job_id))
    except Exception as exc:  # noqa: BLE001
        log.error("task.failed", job=job_id, error=str(exc))
        job_service.update_job(
            job_id, status="failed", error_message=str(exc)[:500]
        )
        # Failed generation should not cost the user a credit.
        sub_service.refund_credit(user_id)
        raise
