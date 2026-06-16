from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LocationCoordinates(BaseModel):
    lat: float
    lng: float
    label: str | None = None


class SceneScript(BaseModel):
    scene_number: int
    narration_text: str
    visual_keywords: list[str]
    is_abstract_scene: bool = False
    is_historical_character: bool = False
    character_name: str | None = None
    location_coordinates: LocationCoordinates | None = None


class StoryScript(BaseModel):
    title: str
    topic: str
    language: str = "en"
    scenes: list[SceneScript]


class GenerateStoryRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=500)
    language: str = Field(default="en", pattern=r"^(en|hi|ur|roman)$")
    duration_minutes: int = Field(default=5, ge=1, le=30)
    style: str = Field(default="vox", pattern=r"^(vox|mighty_monk|bbc)$")


class GenerateStoryResponse(BaseModel):
    job_id: UUID
    story: StoryScript
    credits_remaining: int
    status: str = "story_generated"


class VideoJobStatus(BaseModel):
    job_id: UUID
    status: str
    progress: int = 0
    output_url: str | None = None
    error: str | None = None
    created_at: datetime | None = None
