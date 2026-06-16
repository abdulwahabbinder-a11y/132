from typing import Literal

from pydantic import BaseModel, Field


SupportedLanguage = Literal["english", "hindi", "urdu", "roman"]


class StoryGenerationRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=180)
    language: SupportedLanguage = "english"
    target_duration_minutes: int = Field(default=8, ge=1, le=45)
    tone: str = Field(default="premium documentary", max_length=80)


class LocationCoordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    label: str | None = None


class StoryScene(BaseModel):
    scene_number: int = Field(..., ge=1)
    narration_text: str = Field(..., min_length=1)
    visual_keywords: list[str] = Field(default_factory=list)
    is_abstract_scene: bool = False
    is_historical_character: bool = False
    character_name: str | None = None
    location_coordinates: LocationCoordinates | None = None


class StoryGenerationResponse(BaseModel):
    job_id: str
    status: str
    credits_left: int
    scenes: list[StoryScene]


class JobStatusResponse(BaseModel):
    id: str
    status: str
    topic: str
    language: str
    story_json: list[StoryScene]
    asset_manifest: dict
    render_payload: dict
    final_video_url: str | None = None
    error_message: str | None = None
