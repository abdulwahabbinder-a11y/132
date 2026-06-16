from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


LanguageCode = Literal["en", "hi", "ur", "roman-urdu"]


class AuthenticatedUser(BaseModel):
    id: UUID
    email: str | None = None


class SubscriptionState(BaseModel):
    user_id: UUID
    plan_type: str = "free"
    stripe_customer_id: str | None = None
    video_credits_left: int = 0
    billing_cycle_end: datetime | None = None


class StoryScene(BaseModel):
    scene_number: int = Field(ge=1)
    narration_text: str = Field(min_length=1)
    visual_keywords: list[str] = Field(min_length=1)
    is_abstract_scene: bool
    is_historical_character: bool
    character_name: str | None = None
    location_coordinates: dict[str, float] | None = Field(
        default=None,
        description="Latitude/longitude payload, for example {'lat': 34.5553, 'lng': 69.2075}.",
    )

    @field_validator("location_coordinates")
    @classmethod
    def validate_coordinates(cls, value: dict[str, float] | None) -> dict[str, float] | None:
        if value is None:
            return value
        if "lat" not in value or "lng" not in value:
            raise ValueError("location_coordinates must include lat and lng")
        if not -90 <= value["lat"] <= 90 or not -180 <= value["lng"] <= 180:
            raise ValueError("location_coordinates contains an invalid latitude or longitude")
        return value


class GenerateStoryRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=240)
    language: LanguageCode = "en"
    target_duration_minutes: int = Field(default=8, ge=1, le=60)
    tone: str = Field(default="premium investigative documentary", max_length=120)


class GenerateStoryResponse(BaseModel):
    generation_id: UUID
    scenes: list[StoryScene]
    credits_left: int
    status: Literal["queued"] = "queued"


class TimelineFact(BaseModel):
    title: str
    source_url: str
    summary: str
    timestamp: str | None = None


class MediaAsset(BaseModel):
    scene_number: int
    provider: Literal["wikimedia", "internet_archive", "pexels", "pixabay", "flux", "wan2.1", "liveportrait", "deepvideo"]
    asset_type: Literal["image", "video", "audio", "metadata"]
    url: str | None = None
    local_path: str | None = None
    attribution: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class WordTimestamp(BaseModel):
    word: str
    start: float
    end: float


class VoiceoverResult(BaseModel):
    scene_number: int
    audio_path: str
    word_timestamps: list[WordTimestamp]


class SceneRenderManifest(BaseModel):
    scene: StoryScene
    facts: list[TimelineFact] = Field(default_factory=list)
    assets: list[MediaAsset] = Field(default_factory=list)
    voiceover: VoiceoverResult | None = None
    cinematic_clip_path: str | None = None


class DocumentaryRenderManifest(BaseModel):
    generation_id: UUID
    topic: str
    language: LanguageCode
    scenes: list[SceneRenderManifest]
    mapbox_access_token: str | None = None
    aspect_ratio: str = "21:9"
