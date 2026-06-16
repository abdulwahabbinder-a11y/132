from __future__ import annotations

import enum
import uuid

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class JobStatus(str, enum.Enum):
    pending = "pending"
    scripting = "scripting"
    scraping = "scraping"
    voicing = "voicing"
    animating = "animating"
    assembling = "assembling"
    rendering = "rendering"
    completed = "completed"
    failed = "failed"


class VideoJob(Base, TimestampMixin):
    __tablename__ = "video_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    topic: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, default="english", nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus, name="job_status"), default=JobStatus.pending, nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    script: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    assets: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    output_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="jobs")
