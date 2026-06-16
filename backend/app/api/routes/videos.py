"""Video job listing & status routes for the dashboard."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.video import VideoJobDetail, VideoJobOut
from app.services import jobs as job_service

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.get("", response_model=list[VideoJobOut])
async def list_my_videos(user: CurrentUser = Depends(get_current_user)) -> list[VideoJobOut]:
    rows = job_service.list_jobs(user.id)
    return [VideoJobOut(**_project(r)) for r in rows]


@router.get("/{job_id}", response_model=VideoJobDetail)
async def get_video(job_id: str, user: CurrentUser = Depends(get_current_user)) -> VideoJobDetail:
    job = job_service.get_job(job_id)
    if not job or job["user_id"] != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    detail = _project(job)
    detail.update({"script": job.get("script"), "assets": job.get("assets")})
    return VideoJobDetail(**detail)


def _project(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "topic": row["topic"],
        "language": row.get("language", "english"),
        "status": str(row.get("status", "pending")),
        "progress": int(row.get("progress", 0)),
        "output_url": row.get("output_url"),
        "error_message": row.get("error_message"),
        "created_at": row.get("created_at"),
    }
