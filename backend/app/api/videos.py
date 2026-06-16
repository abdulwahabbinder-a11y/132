"""Video project listing & status endpoint."""

from typing import List

from fastapi import APIRouter, HTTPException

from app.core.auth import CurrentUser
from app.database import supabase_admin
from app.schemas.video import VideoOut

router = APIRouter()


@router.get("/videos", response_model=List[VideoOut])
async def list_videos(user: CurrentUser) -> List[VideoOut]:
    res = (
        supabase_admin()
        .table("videos")
        .select("id, topic, language, status, progress_pct, output_url, "
                "duration_seconds, error_message, created_at")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return [VideoOut(**row) for row in (res.data or [])]


@router.get("/videos/{video_id}", response_model=VideoOut)
async def get_video(video_id: str, user: CurrentUser) -> VideoOut:
    res = (
        supabase_admin()
        .table("videos")
        .select("id, topic, language, status, progress_pct, output_url, "
                "duration_seconds, error_message, created_at")
        .eq("id", video_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Video not found.")
    return VideoOut(**res.data)
