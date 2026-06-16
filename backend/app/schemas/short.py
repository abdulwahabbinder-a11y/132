from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ViralScene(BaseModel):
    scene_number: int
    narration_text: str
    image_prompt: str
    on_screen_text: str | None = None
    duration_seconds: float = 3.0


class ViralScript(BaseModel):
    title: str
    hook: str
    topic: str
    total_duration_seconds: float = 60.0
    scenes: list[ViralScene]


class GenerateShortRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300)
    target_duration_seconds: int = Field(default=60, ge=15, le=90)


class GenerateShortResponse(BaseModel):
    job_id: UUID
    status: str
    phase: str
    message: str


class PipelineLogEntry(BaseModel):
    timestamp: str
    phase: str
    message: str
    progress: int
    level: str = "info"


class ShortJobStatus(BaseModel):
    job_id: UUID
    topic: str
    status: str
    phase: str
    progress: int
    output_url: str | None = None
    error: str | None = None
    logs: list[PipelineLogEntry] = []
    created_at: datetime | None = None


class AdminSettingItem(BaseModel):
    key: str
    value: str = ""
    category: str
    label: str | None = None
    is_secret: bool = True
    value_masked: str | None = None


class AdminSettingsUpdate(BaseModel):
    settings: dict[str, str]
