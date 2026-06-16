"""Schemas for the scripting / story-generation endpoint."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from app.models.video import Scene


class ScriptLanguage(str, Enum):
    """Languages routed to a specific NIM model.

    English -> Llama 3.1; Hindi/Urdu/Roman -> Qwen 2.5.
    """

    ENGLISH = "english"
    HINDI = "hindi"
    URDU = "urdu"
    ROMAN = "roman"


class GenerateStoryRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300, examples=["The Fall of Constantinople"])
    language: ScriptLanguage = ScriptLanguage.ENGLISH
    target_scene_count: int = Field(12, ge=4, le=40)
    style_reference: str = Field(
        "Mighty Monk / Vox high-retention documentary",
        description="Tone/pacing reference passed to the scripting model.",
    )


class StoryScript(BaseModel):
    """Strict chronological JSON returned by the scripting router."""

    title: str
    language: ScriptLanguage
    scenes: list[Scene]


class GenerateStoryResponse(BaseModel):
    video_id: str
    status: str
    credits_left: int
    script: StoryScript
