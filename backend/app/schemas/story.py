"""Pydantic schemas describing the strict LLM scripting JSON contract.

These mirror the JSON the model is required to emit; we validate it before
handing it off to the asset/scraper pipeline.
"""

from typing import List, Literal, Optional, Tuple

from pydantic import BaseModel, Field, conlist

Language = Literal["english", "hindi", "urdu", "roman_urdu", "roman_hindi"]


class Scene(BaseModel):
    scene_number: int = Field(..., ge=1)
    narration_text: str = Field(..., min_length=1, max_length=2500)
    visual_keywords: List[str] = Field(default_factory=list)

    is_abstract_scene: bool = False
    is_historical_character: bool = False
    character_name: Optional[str] = None

    # [lng, lat]; None when scene has no geographic anchor
    location_coordinates: Optional[conlist(float, min_length=2, max_length=2)] = None


class Script(BaseModel):
    title: str
    language: Language
    topic: str
    estimated_duration_seconds: int = Field(default=420, ge=60, le=1800)
    scenes: List[Scene]


# -------------------------- API request / response ---------------------------


class GenerateStoryIn(BaseModel):
    topic: str = Field(..., min_length=3, max_length=240)
    language: Language = "english"
    tone: Literal["mighty_monk", "vox_explainer", "investigative", "cinematic"] = "mighty_monk"
    target_duration_seconds: int = Field(default=420, ge=60, le=1800)


class GenerateStoryOut(BaseModel):
    video_id: str
    script: Script
    credits_left: int
