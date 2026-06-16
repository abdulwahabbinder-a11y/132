from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.models.video_job import VideoJob
from app.schemas.story import GenerateStoryRequest, GenerateStoryResponse
from app.services.story_service import StoryService
from app.workers.pipeline_worker import pipeline_worker

router = APIRouter(tags=["story"])
story_service = StoryService()


@router.post("/generate-story", response_model=GenerateStoryResponse)
async def generate_story(
    payload: GenerateStoryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerateStoryResponse:
    sub = await _latest_subscription(db, user.id)
    if not sub or sub.video_credits_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits left. Please upgrade your plan.",
        )

    scenes = await story_service.generate_story(payload)
    sub.video_credits_left -= 1

    story_json = {"scenes": [scene.model_dump() for scene in scenes]}
    job = VideoJob(user_id=user.id, topic=payload.topic, language=payload.language, story_json=story_json)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    await pipeline_worker.enqueue(job.id)
    return GenerateStoryResponse(job_id=str(job.id), credits_left=sub.video_credits_left, scenes=scenes)


@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(VideoJob).where(VideoJob.id == job_id, VideoJob.user_id == user.id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return {
        "job_id": str(job.id),
        "status": job.status,
        "output_video_url": job.output_video_url,
        "error_message": job.error_message,
        "updated_at": job.updated_at,
    }


async def _latest_subscription(db: AsyncSession, user_id) -> Subscription | None:
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .order_by(desc(Subscription.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()
