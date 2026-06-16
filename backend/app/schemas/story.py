"""Request/response payloads for the story generation endpoint."""

from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel, Field

from .scene import StoryScript


class GenerateStoryRequest(BaseModel):
    topic: str = Field(..., min_length=4, max_length=512)
    language: Literal["en", "hi", "ur", "roman"] = "en"
    target_duration_seconds: int = Field(default=480, ge=60, le=1800)
    style: str = Field(
        default="cinematic-mighty-monk",
        description="Narrative style tag, e.g. 'cinematic-mighty-monk' or 'vox-explainer'.",
    )
    voice_id: str | None = None


class GenerateStoryResponse(BaseModel):
    job_id: uuid.UUID
    credits_left: int
    script: StoryScript
