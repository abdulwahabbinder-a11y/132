"""Video job inspection routes."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.auth import CurrentUser
from app.db.session import DbSession
from app.models.video_job import VideoJob
from app.schemas.job import VideoJobPublic

router = APIRouter()


@router.get("", response_model=list[VideoJobPublic])
async def list_jobs(user: CurrentUser, db: DbSession) -> list[VideoJobPublic]:
    rows = (
        await db.execute(
            select(VideoJob)
            .where(VideoJob.user_id == user.id)
            .order_by(VideoJob.created_at.desc())
        )
    ).scalars().all()
    return [VideoJobPublic.model_validate(job) for job in rows]


@router.get("/{job_id}", response_model=VideoJobPublic)
async def get_job(job_id: uuid.UUID, user: CurrentUser, db: DbSession) -> VideoJobPublic:
    job = (
        await db.execute(
            select(VideoJob).where(VideoJob.id == job_id, VideoJob.user_id == user.id)
        )
    ).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return VideoJobPublic.model_validate(job)
