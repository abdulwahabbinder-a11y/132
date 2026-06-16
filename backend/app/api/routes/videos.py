"""Video listing / status endpoints for the dashboard."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_account
from app.core.supabase_client import get_supabase_admin
from app.services.account import AccountService

router = APIRouter()


@router.get("/videos")
def list_videos(account: AccountService = Depends(get_account)) -> dict:
    """List the current user's videos (most recent first)."""
    db = get_supabase_admin()
    resp = (
        db.table("videos")
        .select("*")
        .eq("user_id", account.user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"videos": resp.data or []}


@router.get("/videos/{video_id}")
def get_video(
    video_id: str, account: AccountService = Depends(get_account)
) -> dict:
    """Fetch a single video plus its scenes (ownership enforced)."""
    db = get_supabase_admin()
    resp = (
        db.table("videos")
        .select("*")
        .eq("id", video_id)
        .eq("user_id", account.user.id)
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found."
        )
    video = resp.data[0]
    scenes = (
        db.table("scenes")
        .select("*")
        .eq("video_id", video_id)
        .order("scene_number")
        .execute()
    )
    video["scenes"] = scenes.data or []
    return video
