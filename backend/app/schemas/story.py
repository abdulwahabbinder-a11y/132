"""Schemas for the scripting router and the strict scene JSON contract."""

from __future__ import annotations

import enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Language(str, enum.Enum):
    english = "english"
    hindi = "hindi"
    urdu = "urdu"
    roman = "roman"  # Roman-script Hindi/Urdu


class GenerateStoryRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300, examples=["The fall of the Berlin Wall"])
    language: Language = Language.english
    target_scene_count: int = Field(12, ge=4, le=40)
    style: str = Field(
        "high-retention cinematic documentary in the style of Vox and Mighty Monk",
        max_length=300,
    )


class LocationCoordinates(BaseModel):
    """A geo point used to drive animated Mapbox/Leaflet sequences."""

    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    label: Optional[str] = None


class Scene(BaseModel):
    """A single chronological documentary scene.

    This is the strict contract enforced on the LLM output. ``visual_keywords``
    drive stock-footage search; ``is_abstract_scene`` routes to Flux vs archival
    scraping; ``is_historical_character`` routes to LivePortrait + DeepVideo-V1.
    """

    scene_number: int = Field(..., ge=1)
    narration_text: str = Field(..., min_length=1)
    visual_keywords: List[str] = Field(default_factory=list)
    is_abstract_scene: bool = False
    is_historical_character: bool = False
    character_name: Optional[str] = None
    location_coordinates: Optional[LocationCoordinates] = None


class StoryScript(BaseModel):
    topic: str
    language: Language
    scenes: List[Scene]


class GenerateStoryResponse(BaseModel):
    job_id: str
    script: StoryScript
    credits_left: int
