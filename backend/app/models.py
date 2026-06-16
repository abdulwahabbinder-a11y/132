from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan_type: Mapped[str] = mapped_column(String(32), default="free", index=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    video_credits_left: Mapped[int] = mapped_column(Integer, default=3)
    billing_cycle_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    subscriptions: Mapped[list[Subscription]] = relationship(back_populates="user", cascade="all, delete-orphan")
    video_projects: Mapped[list[VideoProject]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    plan_type: Mapped[str] = mapped_column(String(32), default="free")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    video_credits_left: Mapped[int] = mapped_column(Integer, default=30)
    billing_cycle_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="subscriptions")


class VideoProject(Base):
    __tablename__ = "video_projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    topic: Mapped[str] = mapped_column(String(500), index=True)
    language: Mapped[str] = mapped_column(String(32), default="english")
    status: Mapped[str] = mapped_column(String(32), default="script_generated", index=True)
    source_model: Mapped[str] = mapped_column(String(128))
    script_payload: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    narration_audio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    subtitles_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    render_output_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="video_projects")
    scene_assets: Mapped[list[SceneAsset]] = relationship(back_populates="project", cascade="all, delete-orphan")


class SceneAsset(Base):
    __tablename__ = "scene_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("video_projects.id", ondelete="CASCADE"), index=True)
    scene_number: Mapped[int] = mapped_column(Integer, index=True)
    fact_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    archival_media_payload: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    stock_media_payload: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    generated_media_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    motion_clip_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    final_clip_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    is_historical_character: Mapped[bool] = mapped_column(Boolean, default=False)
    character_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    project: Mapped[VideoProject] = relationship(back_populates="scene_assets")
