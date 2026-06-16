import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user_id, get_user_subscription
from app.database import get_supabase
from app.schemas.short import (
    GenerateShortRequest,
    GenerateShortResponse,
    PipelineLogEntry,
    ShortJobStatus,
)
from app.workers.background import enqueue_short_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/shorts", tags=["shorts"])


@router.post("/generate", response_model=GenerateShortResponse)
async def generate_short(
    request: GenerateShortRequest,
    user_id: UUID = Depends(get_current_user_id),
):
    subscription = await get_user_subscription(user_id)
    credits_left = subscription.get("video_credits_left", 0)

    if credits_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits remaining. Please upgrade your plan.",
        )

    job_id = uuid4()
    supabase = get_supabase()

    supabase.table("short_video_jobs").insert({
        "id": str(job_id),
        "user_id": str(user_id),
        "topic": request.topic,
        "status": "queued",
        "phase": "queued",
        "progress": 0,
        "logs": [{
            "timestamp": "now",
            "phase": "queued",
            "message": "Job queued — starting viral short pipeline...",
            "progress": 0,
            "level": "info",
        }],
    }).execute()

    new_credits = credits_left - 1
    supabase.table("subscriptions").update(
        {"video_credits_left": new_credits}
    ).eq("user_id", str(user_id)).execute()

    enqueue_short_pipeline.delay(
        str(job_id),
        request.topic,
        request.target_duration_seconds,
    )

    return GenerateShortResponse(
        job_id=job_id,
        status="queued",
        phase="queued",
        message="Viral short generation started",
    )


@router.get("", response_model=list[ShortJobStatus])
async def list_short_jobs(user_id: UUID = Depends(get_current_user_id)):
    supabase = get_supabase()
    result = (
        supabase.table("short_video_jobs")
        .select("id, topic, status, phase, progress, output_url, error, logs, created_at")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    jobs = []
    for row in (result.data or []):
        logs = [PipelineLogEntry(**log) for log in (row.get("logs") or [])]
        jobs.append(ShortJobStatus(
            job_id=row["id"],
            topic=row["topic"],
            status=row["status"],
            phase=row["phase"],
            progress=row.get("progress", 0),
            output_url=row.get("output_url"),
            error=row.get("error"),
            logs=logs,
            created_at=row.get("created_at"),
        ))
    return jobs


@router.get("/{job_id}/logs", response_model=list[PipelineLogEntry])
async def get_short_logs(
    job_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    supabase = get_supabase()
    result = (
        supabase.table("short_video_jobs")
        .select("logs, user_id")
        .eq("id", str(job_id))
        .maybe_single()
        .execute()
    )

    if not result.data or result.data["user_id"] != str(user_id):
        raise HTTPException(status_code=404, detail="Job not found")

    return [PipelineLogEntry(**log) for log in (result.data.get("logs") or [])]


@router.get("/{job_id}", response_model=ShortJobStatus)
async def get_short_job(
    job_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
):
    supabase = get_supabase()
    result = (
        supabase.table("short_video_jobs")
        .select("*")
        .eq("id", str(job_id))
        .maybe_single()
        .execute()
    )

    if not result.data or result.data["user_id"] != str(user_id):
        raise HTTPException(status_code=404, detail="Job not found")

    row = result.data
    logs = [PipelineLogEntry(**log) for log in (row.get("logs") or [])]

    return ShortJobStatus(
        job_id=row["id"],
        topic=row["topic"],
        status=row["status"],
        phase=row["phase"],
        progress=row.get("progress", 0),
        output_url=row.get("output_url"),
        error=row.get("error"),
        logs=logs,
        created_at=row.get("created_at"),
    )
