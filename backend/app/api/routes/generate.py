"""Story / documentary generation endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_account
from app.core.logging import logger
from app.schemas.story import GenerateStoryRequest, GenerateStoryResponse
from app.services import video_service
from app.services.account import AccountService, InsufficientCreditsError
from app.services.ai.nim_client import NIMNotConfiguredError
from app.services.scripting.router import get_scripting_router

router = APIRouter()


@router.post(
    "/generate-story",
    response_model=GenerateStoryResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_story(
    request: GenerateStoryRequest,
    account: AccountService = Depends(get_account),
) -> GenerateStoryResponse:
    """Generate a chronological documentary script and queue full video rendering.

    Flow:
      1. Enforce ``video_credits_left > 0`` (402 if exhausted).
      2. Route to Llama 3.1 (English) or Qwen 2.5 (Hindi/Urdu/Roman) via NIM.
      3. Persist the video + scenes, decrement a credit, and enqueue the worker.
    """
    # 1. Credit gate.
    try:
        account.ensure_credits()
    except InsufficientCreditsError as exc:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(exc)
        ) from exc

    # 2. Scripting router.
    router_ = get_scripting_router()
    try:
        script = await router_.generate(request)
    except NIMNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except Exception as exc:  # noqa: BLE001 - surface scripting failures
        logger.exception("Scripting failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Scripting model error: {exc}",
        ) from exc

    if not script.scenes:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Scripting model returned no scenes.",
        )

    # 3. Persist, charge, enqueue.
    video = video_service.create_video_record(
        user_id=account.user.id, topic=request.topic, script=script
    )
    credits_left = account.decrement_credit()
    video_service.enqueue_generation(video)

    return GenerateStoryResponse(
        video_id=video.id,
        status=video.status.value,
        credits_left=credits_left,
        script=script,
    )
