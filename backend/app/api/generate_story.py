"""POST /api/generate-story — credit-gated LLM scripting endpoint.

Flow:
    1. Auth via Supabase JWT.
    2. Verify `video_credits_left > 0`.
    3. Decrement credit atomically (RPC-style fetch+update).
    4. Run LLM router (Llama 3.1 / Qwen 2.5) → strict JSON Script.
    5. Persist `videos` row in `scripting` status.
    6. Enqueue async media pipeline (Celery).
    7. Return the script + new video_id immediately.
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

from app.core.auth import CurrentUser
from app.database import supabase_admin
from app.schemas.story import GenerateStoryIn, GenerateStoryOut
from app.services.llm_router import generate_script
from app.workers.video_pipeline import build_video_task

router = APIRouter()


@router.post("/generate-story", response_model=GenerateStoryOut)
async def generate_story(body: GenerateStoryIn, user: CurrentUser) -> GenerateStoryOut:
    if user.video_credits_left <= 0:
        raise HTTPException(
            status_code=402,
            detail="No video credits remaining. Upgrade to Pro to continue.",
        )

    sb = supabase_admin()

    # ---- Atomic credit decrement ------------------------------------------
    new_credits = user.video_credits_left - 1
    upd = (
        sb.table("subscriptions")
        .update({"video_credits_left": new_credits})
        .eq("user_id", user.id)
        .gt("video_credits_left", 0)
        .execute()
    )
    if not upd.data:
        raise HTTPException(409, "Credit decrement race; please retry.")

    # ---- LLM scripting ----------------------------------------------------
    try:
        script = await generate_script(
            topic=body.topic,
            language=body.language,
            tone=body.tone,
            target_duration_seconds=body.target_duration_seconds,
        )
    except Exception as exc:
        # Refund credit on hard failure so the user isn't punished.
        sb.table("subscriptions").update(
            {"video_credits_left": user.video_credits_left}
        ).eq("user_id", user.id).execute()
        logger.exception("Script generation failed for user {}", user.id)
        raise HTTPException(502, f"Scripting failed: {exc}") from exc

    # ---- Persist video row -----------------------------------------------
    insert = (
        sb.table("videos")
        .insert(
            {
                "user_id": user.id,
                "topic": body.topic,
                "language": body.language,
                "status": "scraping",
                "progress_pct": 10,
                "script_json": script.model_dump(),
            }
        )
        .execute()
    )
    video_id = insert.data[0]["id"]

    # ---- Kick off async pipeline -----------------------------------------
    build_video_task.delay(video_id)
    logger.info("Queued media pipeline for video {} (user {})", video_id, user.id)

    return GenerateStoryOut(
        video_id=video_id,
        script=script,
        credits_left=new_credits,
    )
