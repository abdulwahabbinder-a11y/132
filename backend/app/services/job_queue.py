"""Dispatch video jobs to Celery (Docker) or SQS (AWS Lambda serverless)."""

from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)


def _use_sqs() -> bool:
    return os.environ.get("JOB_QUEUE_MODE", "").lower() == "sqs"


def enqueue_documentary(job_id: str) -> None:
    if _use_sqs():
        import boto3

        queue_url = os.environ["VIDEO_QUEUE_URL"]
        boto3.client("sqs").send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps({"type": "documentary", "job_id": job_id}),
        )
        logger.info("Queued documentary job %s to SQS", job_id)
        return

    from app.workers.background import enqueue_video_pipeline

    enqueue_video_pipeline.delay(job_id)


def enqueue_short(job_id: str, topic: str, target_duration_seconds: int = 60) -> None:
    if _use_sqs():
        import boto3

        queue_url = os.environ["VIDEO_QUEUE_URL"]
        boto3.client("sqs").send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(
                {
                    "type": "short",
                    "job_id": job_id,
                    "topic": topic,
                    "target_duration_seconds": target_duration_seconds,
                }
            ),
        )
        logger.info("Queued short job %s to SQS", job_id)
        return

    from app.workers.background import enqueue_short_pipeline

    enqueue_short_pipeline.delay(job_id, topic, target_duration_seconds)
