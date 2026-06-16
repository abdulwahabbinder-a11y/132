import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user_id, get_user_subscription
from app.schemas.story import GenerateStoryRequest, GenerateStoryResponse
from app.services.llm.router import StoryGenerationRouter
from app.services.credits import can_render_video, deduct_credits
from app.workers.background import enqueue_video_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate-story", tags=["generation"])

story_router = StoryGenerationRouter()


@router.post("", response_model=GenerateStoryResponse)
async def generate_story(
    request: GenerateStoryRequest,
    user_id: UUID = Depends(get_current_user_id),
):
    subscription = await get_user_subscription(user_id)
    credits_left = subscription.get("video_credits_left", 0)

    if not can_render_video(credits_left):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Not enough credits for one video (5 credits required). Please upgrade your plan.",
        )

    try:
        story = await story_router.generate(
            topic=request.topic,
            language=request.language,
            duration_minutes=request.duration_minutes,
            style=request.style,
        )
    except Exception as exc:
        logger.exception("Story generation failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Story generation failed: {exc}",
        ) from exc

    job_id = uuid4()

    from app.database import get_supabase

    supabase = get_supabase()
    supabase.table("video_jobs").insert(
        {
            "id": str(job_id),
            "user_id": str(user_id),
            "topic": request.topic,
            "language": request.language,
            "status": "story_generated",
            "progress": 10,
            "story_json": story.model_dump(),
        }
    ).execute()

    new_credits = deduct_credits(credits_left)
    supabase.table("subscriptions").update(
        {"video_credits_left": new_credits}
    ).eq("user_id", str(user_id)).execute()

    enqueue_video_pipeline.delay(str(job_id))

    return GenerateStoryResponse(
        job_id=job_id,
        story=story,
        credits_remaining=new_credits,
        status="story_generated",
    )
