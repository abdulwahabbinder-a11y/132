"""AWS Lambda entrypoint for FFmpeg / Remotion video rendering (SQS trigger)."""

from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger(__name__)


def handler(event: dict[str, Any], _context: object) -> dict[str, Any]:
    failures: list[dict[str, str]] = []

    for record in event.get("Records", []):
        message_id = record.get("messageId", "unknown")
        try:
            body = json.loads(record["body"])
            job_type = body.get("type")

            if job_type == "documentary":
                from app.services.asset_worker import run_video_pipeline

                run_video_pipeline(body["job_id"])
            elif job_type == "short":
                from app.services.short_pipeline import run_short_pipeline

                run_short_pipeline(
                    body["job_id"],
                    body["topic"],
                    int(body.get("target_duration_seconds", 60)),
                )
            else:
                raise ValueError(f"Unknown job type: {job_type}")

            logger.info("Processed SQS job %s (%s)", message_id, job_type)
        except Exception:
            logger.exception("Failed to process SQS message %s", message_id)
            failures.append({"itemIdentifier": message_id})

    return {"batchItemFailures": failures}
