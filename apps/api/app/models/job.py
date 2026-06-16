import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class JobStatus(str, enum.Enum):
    queued = "queued"
    gathering_facts = "gathering_facts"
    downloading_assets = "downloading_assets"
    synthesizing_audio = "synthesizing_audio"
    animating_scenes = "animating_scenes"
    rendering_video = "rendering_video"
    completed = "completed"
    failed = "failed"


class GenerationJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "generation_jobs"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[JobStatus] = mapped_column(default=JobStatus.queued, nullable=False, index=True)
    story_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    asset_manifest: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    subtitles_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    render_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="generation_jobs")
