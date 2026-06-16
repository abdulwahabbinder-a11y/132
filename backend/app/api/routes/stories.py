"""POST /api/generate-story — credit-gated documentary scripting."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.auth import CurrentUser
from app.db.session import DbSession
from app.models.subscription import Subscription
from app.models.user import User
from app.models.video_job import JobStatus, VideoJob
from app.schemas.story import GenerateStoryRequest, GenerateStoryResponse
from app.services.llm import generate_story_script
from app.workers.tasks import run_pipeline_task

router = APIRouter()


async def _get_or_create_subscription(db, user_id: str) -> tuple[User, Subscription]:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not provisioned in database.")

    sub = (
        await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    ).scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=user.id)
        db.add(sub)
        await db.flush()
    return user, sub


@router.post(
    "/generate-story",
    response_model=GenerateStoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_story(
    payload: GenerateStoryRequest,
    user: CurrentUser,
    db: DbSession,
) -> GenerateStoryResponse:
    _, sub = await _get_or_create_subscription(db, user.id)
    if sub.video_credits_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits left. Upgrade your plan or wait for the next billing cycle.",
        )

    script = await generate_story_script(payload)

    sub.video_credits_left = max(0, sub.video_credits_left - 1)

    job = VideoJob(
        user_id=user.id,
        topic=payload.topic,
        language=script.language,
        status=JobStatus.scripting,
        story_json=script.model_dump(mode="json"),
    )
    db.add(job)
    await db.flush()

    run_pipeline_task.delay(str(job.id))

    return GenerateStoryResponse(
        job_id=job.id,
        credits_left=sub.video_credits_left,
        script=script,
    )
