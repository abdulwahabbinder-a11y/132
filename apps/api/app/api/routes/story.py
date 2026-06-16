import uuid
import asyncio

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session_dep, get_current_user
from app.models.job import GenerationJob, JobStatus
from app.schemas.story import (
    JobResponse,
    StoryGenerationRequest,
    StoryGenerationResponse,
    SubscriptionSummary,
)
from app.services.llm import DocumentaryScriptService
from app.workers.story_pipeline import run_generation_pipeline

router = APIRouter(tags=["story"])


@router.post("/generate-story", response_model=StoryGenerationResponse)
async def generate_story(
    payload: StoryGenerationRequest,
    user_and_subscription=Depends(get_current_user),
    session: AsyncSession = Depends(db_session_dep),
) -> StoryGenerationResponse:
    user, subscription = user_and_subscription
    if subscription.video_credits_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="You have no video credits left for this billing cycle.",
        )

    story_service = DocumentaryScriptService()
    scenes = await story_service.generate_story(payload)

    subscription.video_credits_left -= 1
    job = GenerationJob(
        user_id=user.id,
        topic=payload.topic,
        language=payload.language,
        status=JobStatus.queued,
        story_json={"story": [scene.model_dump(mode="json") for scene in scenes]},
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)

    asyncio.create_task(run_generation_pipeline(job.id))

    return StoryGenerationResponse(
        job_id=job.id,
        remaining_credits=subscription.video_credits_left,
        story=scenes,
    )


@router.get("/me/subscription", response_model=SubscriptionSummary)
async def subscription_summary(user_and_subscription=Depends(get_current_user)) -> SubscriptionSummary:
    _, subscription = user_and_subscription
    return SubscriptionSummary(
        plan_type=subscription.plan_type,
        video_credits_left=subscription.video_credits_left,
        billing_cycle_end=subscription.billing_cycle_end,
    )


@router.get("/jobs", response_model=list[JobResponse])
async def list_jobs(
    user_and_subscription=Depends(get_current_user),
    session: AsyncSession = Depends(db_session_dep),
) -> list[JobResponse]:
    user, _ = user_and_subscription
    result = await session.execute(
        select(GenerationJob)
        .where(GenerationJob.user_id == user.id)
        .order_by(GenerationJob.created_at.desc())
        .limit(20)
    )
    jobs = result.scalars().all()
    return [JobResponse.from_orm_job(job) for job in jobs]


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: uuid.UUID,
    user_and_subscription=Depends(get_current_user),
    session: AsyncSession = Depends(db_session_dep),
) -> JobResponse:
    user, _ = user_and_subscription
    result = await session.execute(
        select(GenerationJob).where(GenerationJob.id == job_id, GenerationJob.user_id == user.id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobResponse.from_orm_job(job)
