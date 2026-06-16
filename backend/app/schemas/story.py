from pydantic import BaseModel, Field, field_validator

SUPPORTED_REGIONAL_LANGUAGES = {"hindi", "urdu", "roman"}


class SceneSchema(BaseModel):
    scene_number: int
    narration_text: str
    visual_keywords: list[str]
    is_abstract_scene: bool
    is_historical_character: bool
    character_name: str | None = None
    location_coordinates: str = Field(
        ...,
        description="Latitude,Longitude pair string for map scene rendering.",
        examples=["48.8566,2.3522"],
    )

    @field_validator("scene_number")
    @classmethod
    def enforce_scene_order(cls, value: int) -> int:
        if value < 1:
            raise ValueError("scene_number must start at 1")
        return value


class GenerateStoryRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=300)
    language: str = Field(default="english")
    target_duration_seconds: int = Field(default=240, ge=30, le=1800)

    @property
    def use_regional_model(self) -> bool:
        return self.language.strip().lower() in SUPPORTED_REGIONAL_LANGUAGES


class GenerateStoryResponse(BaseModel):
    job_id: str
    credits_left: int
    scenes: list[SceneSchema]
