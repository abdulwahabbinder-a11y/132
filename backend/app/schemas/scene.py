"""Pydantic schemas matching the LLM scripting JSON contract."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class GeoPoint(BaseModel):
    """A single location coordinate (lon/lat) compatible with Mapbox."""

    lon: float = Field(..., ge=-180, le=180)
    lat: float = Field(..., ge=-90, le=90)
    label: str | None = None


class Scene(BaseModel):
    """One chronological scene of the documentary."""

    scene_number: int = Field(..., ge=1)
    narration_text: str = Field(..., min_length=1)
    visual_keywords: list[str] = Field(default_factory=list)
    is_abstract_scene: bool = False
    is_historical_character: bool = False
    character_name: str | None = None
    location_coordinates: list[GeoPoint] = Field(default_factory=list)

    duration_seconds: float | None = None
    notes: str | None = None

    @field_validator("visual_keywords")
    @classmethod
    def _trim_keywords(cls, value: list[str]) -> list[str]:
        return [k.strip() for k in value if k and k.strip()]

    @field_validator("character_name")
    @classmethod
    def _normalise_character(cls, value: str | None, info: Any) -> str | None:
        is_char = info.data.get("is_historical_character") if info.data else False
        if is_char and not value:
            raise ValueError("character_name required when is_historical_character=true")
        return value


class StoryScript(BaseModel):
    """Top-level chronological script returned by the LLM."""

    topic: str
    language: str = "en"
    model: str
    summary: str | None = None
    scenes: list[Scene]

    @field_validator("scenes")
    @classmethod
    def _enforce_chronology(cls, scenes: list[Scene]) -> list[Scene]:
        if not scenes:
            raise ValueError("StoryScript.scenes must not be empty.")
        numbers = [s.scene_number for s in scenes]
        if numbers != sorted(numbers):
            raise ValueError("Scenes must be ordered chronologically by scene_number.")
        return scenes
