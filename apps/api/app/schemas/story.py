import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.job import JobStatus
from app.models.subscription import PlanType

SupportedLanguage = Literal["english", "hindi", "urdu", "roman-urdu", "roman"]


class LocationCoordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class DocumentaryScene(BaseModel):
    scene_number: int = Field(..., ge=1)
    narration_text: str = Field(..., min_length=20)
    visual_keywords: list[str] = Field(default_factory=list, min_length=1)
    is_abstract_scene: bool
    is_historical_character: bool
    character_name: str | None = None
    location_coordinates: LocationCoordinates | None = None

    @field_validator("visual_keywords")
    @classmethod
    def normalize_keywords(cls, value: list[str]) -> list[str]:
        return [keyword.strip() for keyword in value if keyword.strip()]


class StoryGenerationRequest(BaseModel):
    topic: str = Field(..., min_length=6, max_length=255)
    language: SupportedLanguage = "english"
    target_duration_seconds: int = Field(default=180, ge=60, le=900)
    cinematic_tone: str = Field(default="premium documentary")


class StoryGenerationResponse(BaseModel):
    job_id: uuid.UUID
    remaining_credits: int
    story: list[DocumentaryScene]


class SubscriptionSummary(BaseModel):
    plan_type: PlanType
    video_credits_left: int
    billing_cycle_end: datetime | None = None


class JobResponse(BaseModel):
    id: uuid.UUID
    topic: str
    language: str
    status: JobStatus
    story_json: dict
    asset_manifest: dict | None
    subtitles_json: dict | None
    render_url: str | None
    error_message: str | None
    completed_at: datetime | None = None

    @classmethod
    def from_orm_job(cls, job) -> "JobResponse":
        return cls(
            id=job.id,
            topic=job.topic,
            language=job.language,
            status=job.status,
            story_json=job.story_json,
            asset_manifest=job.asset_manifest,
            subtitles_json=job.subtitles_json,
            render_url=job.render_url,
            error_message=job.error_message,
            completed_at=job.completed_at,
        )
