"""POST /api/generate-story — authenticated, credit-gated generation entrypoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import require_credit
from app.schemas.auth import CurrentUser
from app.schemas.story import GenerateStoryRequest, GenerateStoryResponse
from app.services import jobs as job_service
from app.services import subscriptions as sub_service
from app.services.scripting.router import generate_script
from app.workers.tasks import generate_documentary

router = APIRouter(prefix="/api", tags=["generation"])


@router.post("/generate-story", response_model=GenerateStoryResponse)
async def generate_story(
    payload: GenerateStoryRequest,
    user: CurrentUser = Depends(require_credit),
) -> GenerateStoryResponse:
    """Generate the documentary script, then dispatch the async render pipeline.

    ``require_credit`` already rejected the request with HTTP 402 if the user has
    ``video_credits_left == 0``.
    """
    script = await generate_script(payload)

    job_id = job_service.create_job(
        user_id=user.id,
        topic=payload.topic,
        language=payload.language.value,
        script=script.model_dump(mode="json"),
    )

    # Consume a credit now that scripting succeeded; refunded by the worker on failure.
    remaining = sub_service.decrement_credit(user.id)

    job_service.set_status(job_id, "scripting", 10)
    generate_documentary.delay(job_id, user.id)

    return GenerateStoryResponse(job_id=job_id, script=script, credits_left=remaining)
