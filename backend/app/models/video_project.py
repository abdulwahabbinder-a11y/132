import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, ForeignKey,
    Enum, Text, JSON, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class VideoStatus(str, PyEnum):
    PENDING = "pending"
    SCRIPTING = "scripting"
    FETCHING_MEDIA = "fetching_media"
    GENERATING_AUDIO = "generating_audio"
    ANIMATING = "animating"
    ASSEMBLING = "assembling"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoLanguage(str, PyEnum):
    ENGLISH = "en"
    HINDI = "hi"
    URDU = "ur"
    ROMAN = "ro"


class AspectRatio(str, PyEnum):
    CINEMATIC = "21:9"
    WIDESCREEN = "16:9"
    PORTRAIT = "9:16"


class VideoProject(Base):
    __tablename__ = "video_projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(512), nullable=False)
    topic: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[VideoLanguage] = mapped_column(
        Enum(VideoLanguage), default=VideoLanguage.ENGLISH, nullable=False
    )
    style: Mapped[str] = mapped_column(String(100), default="documentary")  # documentary|explainer|vox
    aspect_ratio: Mapped[AspectRatio] = mapped_column(
        Enum(AspectRatio), default=AspectRatio.CINEMATIC
    )

    status: Mapped[VideoStatus] = mapped_column(
        Enum(VideoStatus), default=VideoStatus.PENDING, nullable=False
    )
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    # Generated content
    script_json: Mapped[dict] = mapped_column(JSON, nullable=True)       # Full LLM script output
    audio_url: Mapped[str] = mapped_column(String(1024), nullable=True)  # ElevenLabs final audio
    word_timestamps: Mapped[dict] = mapped_column(JSON, nullable=True)    # ElevenLabs timestamps
    output_video_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    thumbnail_url: Mapped[str] = mapped_column(String(1024), nullable=True)

    # Video metadata
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=True)
    total_scenes: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="video_projects")
    scenes: Mapped[list["VideoScene"]] = relationship(
        "VideoScene", back_populates="project", cascade="all, delete-orphan", order_by="VideoScene.scene_number"
    )

    def __repr__(self) -> str:
        return f"<VideoProject id={self.id} title={self.title} status={self.status}>"


class VideoScene(Base):
    __tablename__ = "video_scenes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("video_projects.id", ondelete="CASCADE"), nullable=False, index=True
    )

    scene_number: Mapped[int] = mapped_column(Integer, nullable=False)
    narration_text: Mapped[str] = mapped_column(Text, nullable=False)
    visual_keywords: Mapped[list] = mapped_column(JSON, default=list)
    is_abstract_scene: Mapped[bool] = mapped_column(Boolean, default=False)
    is_historical_character: Mapped[bool] = mapped_column(Boolean, default=False)
    character_name: Mapped[str] = mapped_column(String(255), nullable=True)
    location_coordinates: Mapped[dict] = mapped_column(JSON, nullable=True)  # {lat, lng, zoom, label}

    # Media assets
    image_url: Mapped[str] = mapped_column(String(1024), nullable=True)      # Wikimedia / Flux image
    video_clip_url: Mapped[str] = mapped_column(String(1024), nullable=True) # Wan2.1 animated clip
    stock_footage_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    audio_slice_url: Mapped[str] = mapped_column(String(1024), nullable=True) # Scene TTS slice
    lipsync_video_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    final_clip_url: Mapped[str] = mapped_column(String(1024), nullable=True)

    # Timing
    start_time_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    end_time_ms: Mapped[int] = mapped_column(Integer, nullable=True)

    # Status
    media_fetched: Mapped[bool] = mapped_column(Boolean, default=False)
    animated: Mapped[bool] = mapped_column(Boolean, default=False)
    lipsync_done: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["VideoProject"] = relationship("VideoProject", back_populates="scenes")

    def __repr__(self) -> str:
        return f"<VideoScene #{self.scene_number} project={self.project_id}>"
