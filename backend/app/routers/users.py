from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user_id
from app.database import get_supabase
from app.schemas.story import VideoJobStatus
from app.schemas.user import SubscriptionResponse, UserResponse
from app.services.downloads import resolve_local_video, stream_video_file

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user_id: UUID = Depends(get_current_user_id)):
    supabase = get_supabase()
    result = (
        supabase.table("users")
        .select("id, email, full_name")
        .eq("id", str(user_id))
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(user_id: UUID = Depends(get_current_user_id)):
    supabase = get_supabase()
    result = (
        supabase.table("subscriptions")
        .select("plan_type, video_credits_left, billing_cycle_end, stripe_customer_id")
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return result.data


@router.get("/jobs", response_model=list[VideoJobStatus])
async def list_jobs(user_id: UUID = Depends(get_current_user_id)):
    supabase = get_supabase()
    result = (
        supabase.table("video_jobs")
        .select("id, status, progress, output_url, error, created_at")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return [
        VideoJobStatus(
            job_id=row["id"],
            status=row["status"],
            progress=row.get("progress", 0),
            output_url=row.get("output_url"),
            error=row.get("error"),
            created_at=row.get("created_at"),
        )
        for row in (result.data or [])
    ]


@router.get("/jobs/{job_id}/download")
async def download_job(
    job_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    supabase = get_supabase()
    result = (
        supabase.table("video_jobs")
        .select("output_url, user_id, topic")
        .eq("id", str(job_id))
        .maybe_single()
        .execute()
    )
    if not result.data or result.data["user_id"] != str(user_id):
        raise HTTPException(status_code=404, detail="Job not found")

    path = resolve_local_video(result.data.get("output_url"))
    if not path:
        raise HTTPException(status_code=404, detail="Video file not available yet")

    safe_name = "documentary.mp4"
    return stream_video_file(path, safe_name)


@router.get("/jobs/{job_id}", response_model=VideoJobStatus)
async def get_job(job_id: UUID, user_id: UUID = Depends(get_current_user_id)):
    supabase = get_supabase()
    result = (
        supabase.table("video_jobs")
        .select("id, status, progress, output_url, error, created_at, user_id")
        .eq("id", str(job_id))
        .maybe_single()
        .execute()
    )
    if not result.data or result.data["user_id"] != str(user_id):
        raise HTTPException(status_code=404, detail="Job not found")
    row = result.data
    return VideoJobStatus(
        job_id=row["id"],
        status=row["status"],
        progress=row.get("progress", 0),
        output_url=row.get("output_url"),
        error=row.get("error"),
        created_at=row.get("created_at"),
    )
