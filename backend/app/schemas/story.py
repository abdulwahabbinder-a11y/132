from pydantic import BaseModel, Field, field_validator


SUPPORTED_NON_ENGLISH_LANGUAGES = {"hi", "ur", "roman-ur", "roman-hi"}


class StoryGenerationRequest(BaseModel):
    topic: str = Field(min_length=5, max_length=300)
    language: str = Field(default="en", description="en, hi, ur, roman-hi, roman-ur")
    tone: str = Field(default="cinematic documentary")
    target_minutes: int = Field(default=8, ge=1, le=20)


class StoryScene(BaseModel):
    scene_number: int = Field(ge=1)
    narration_text: str = Field(min_length=15)
    visual_keywords: list[str] = Field(min_length=1)
    is_abstract_scene: bool
    is_historical_character: bool
    character_name: str | None = None
    location_coordinates: dict[str, float] | None = None

    @field_validator("location_coordinates")
    @classmethod
    def validate_coordinates(cls, value: dict[str, float] | None) -> dict[str, float] | None:
        if value is None:
            return value
        if "lat" not in value or "lng" not in value:
            raise ValueError("location_coordinates must include lat and lng")
        return value


class StoryGenerationResponse(BaseModel):
    project_id: str
    language_model: str
    scenes: list[StoryScene]
    video_credits_left: int
