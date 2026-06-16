"""Public video-job representation."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.video_job import JobStatus


class VideoJobPublic(BaseModel):
    id: uuid.UUID
    topic: str
    language: str
    status: JobStatus
    story_json: dict[str, Any] | None = None
    output_url: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
