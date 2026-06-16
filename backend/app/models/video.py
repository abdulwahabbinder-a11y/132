"""``videos`` and ``scenes`` table representations."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class VideoStatus(str, Enum):
    QUEUED = "queued"
    SCRIPTING = "scripting"
    SCRAPING = "scraping"
    GENERATING_MEDIA = "generating_media"
    SYNTHESISING = "synthesising"
    ASSEMBLING = "assembling"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class Scene(BaseModel):
    """A single chronological scene produced by the scripting router."""

    scene_number: int
    narration_text: str
    visual_keywords: list[str] = Field(default_factory=list)
    is_abstract_scene: bool = False
    is_historical_character: bool = False
    character_name: str | None = None
    # [longitude, latitude] — null when the scene is not geolocated.
    location_coordinates: list[float] | None = None

    # Populated by the worker pipeline as assets are produced.
    audio_url: str | None = None
    word_timestamps: list[dict] = Field(default_factory=list)
    media_assets: list[dict] = Field(default_factory=list)
    clip_url: str | None = None


class Video(BaseModel):
    id: str | None = None
    user_id: str
    topic: str
    language: str = "english"
    status: VideoStatus = VideoStatus.QUEUED
    progress: int = 0
    scenes: list[Scene] = Field(default_factory=list)
    output_url: str | None = None
    error: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
