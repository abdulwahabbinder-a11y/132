import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.video_project import VideoProject, VideoScene, VideoStatus
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────

class SceneDetail(BaseModel):
    id: uuid.UUID
    scene_number: int
    narration_text: str
    visual_keywords: list[str]
    is_abstract_scene: bool
    is_historical_character: bool
    character_name: str | None
    location_coordinates: dict | None
    image_url: str | None
    video_clip_url: str | None
    final_clip_url: str | None
    start_time_ms: int | None
    end_time_ms: int | None
    media_fetched: bool
    animated: bool
    lipsync_done: bool

    class Config:
        from_attributes = True


class VideoProjectDetail(BaseModel):
    id: uuid.UUID
    title: str
    topic: str
    language: str
    style: str
    status: VideoStatus
    progress_percent: int
    error_message: str | None
    output_video_url: str | None
    thumbnail_url: str | None
    duration_seconds: float | None
    total_scenes: int
    word_timestamps: dict | None
    scenes: list[SceneDetail]
    created_at: datetime
    completed_at: datetime | None

    class Config:
        from_attributes = True


class VideoProjectSummary(BaseModel):
    id: uuid.UUID
    title: str
    topic: str
    status: VideoStatus
    progress_percent: int
    thumbnail_url: str | None
    duration_seconds: float | None
    total_scenes: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Routes ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[VideoProjectSummary])
async def list_videos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """List all video projects for the authenticated user."""
    result = await db.execute(
        select(VideoProject)
        .where(VideoProject.user_id == current_user.id)
        .order_by(VideoProject.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{project_id}", response_model=VideoProjectDetail)
async def get_video(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get detailed info for a specific video project including all scenes."""
    result = await db.execute(
        select(VideoProject).where(
            VideoProject.id == project_id,
            VideoProject.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Video project not found")

    scenes_result = await db.execute(
        select(VideoScene)
        .where(VideoScene.project_id == project_id)
        .order_by(VideoScene.scene_number)
    )
    project.scenes = scenes_result.scalars().all()
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a video project."""
    result = await db.execute(
        select(VideoProject).where(
            VideoProject.id == project_id,
            VideoProject.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Video project not found")

    await db.delete(project)
    await db.commit()


@router.get("/{project_id}/status")
async def get_video_status(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Lightweight status polling endpoint for the frontend progress tracker."""
    result = await db.execute(
        select(VideoProject.status, VideoProject.progress_percent, VideoProject.error_message, VideoProject.output_video_url)
        .where(VideoProject.id == project_id, VideoProject.user_id == current_user.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Video project not found")

    return {
        "project_id": str(project_id),
        "status": row.status,
        "progress_percent": row.progress_percent,
        "error_message": row.error_message,
        "output_video_url": row.output_video_url,
    }
