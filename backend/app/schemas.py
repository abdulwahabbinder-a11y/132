from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class LocationCoordinates(BaseModel):
    latitude: float
    longitude: float


class StoryScene(BaseModel):
    scene_number: int = Field(ge=1)
    narration_text: str = Field(min_length=10)
    visual_keywords: list[str] = Field(default_factory=list)
    is_abstract_scene: bool = False
    is_historical_character: bool = False
    character_name: str | None = None
    location_coordinates: LocationCoordinates | None = None

    @field_validator("character_name")
    @classmethod
    def validate_character_name(cls, value: str | None, info) -> str | None:
        if info.data.get("is_historical_character") and not value:
            raise ValueError("character_name is required when is_historical_character is true.")
        return value


class GenerateStoryRequest(BaseModel):
    topic: str = Field(min_length=5, max_length=500)
    language: Literal["english", "hindi", "urdu", "roman"]
    target_duration_seconds: int = Field(default=180, ge=30, le=1800)
    tone: str = Field(default="documentary, premium, high-retention")


class GenerateStoryResponse(BaseModel):
    project_id: str
    status: str
    source_model: str
    credits_left: int
    scenes: list[StoryScene]


class StripeWebhookResponse(BaseModel):
    received: bool
    subscription_id: str | None = None


class UserSummary(BaseModel):
    id: str
    email: str
    plan_type: str
    video_credits_left: int
    billing_cycle_end: datetime | None = None


class ProjectSummary(BaseModel):
    id: str
    topic: str
    language: str
    status: str
    render_output_url: str | None = None
    created_at: datetime


class DashboardResponse(BaseModel):
    user: UserSummary
    recent_projects: list[ProjectSummary]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    services: dict[str, Any]
