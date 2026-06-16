from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.api.dependencies import get_app_settings, get_current_user, get_supabase_service
from app.core.config import Settings
from app.models.domain import AuthenticatedUser
from app.schemas.story import (
    JobStatusResponse,
    StoryGenerationRequest,
    StoryGenerationResponse,
    StoryScene,
)
from app.services.character_engine import CharacterCinematicsEngine
from app.services.elevenlabs import ElevenLabsClient
from app.services.media_sources import PublicMediaFetcher
from app.services.nvidia_nim import NvidiaNimClient
from app.services.rendering import RemotionRenderer
from app.services.supabase_service import SupabaseService
from app.workers.video_pipeline import DocumentaryVideoPipeline

router = APIRouter(prefix="/api", tags=["story"])


@router.post("/generate-story", response_model=StoryGenerationResponse)
async def generate_story(
    request: StoryGenerationRequest,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(get_current_user),
    settings: Settings = Depends(get_app_settings),
    supabase: SupabaseService = Depends(get_supabase_service),
) -> StoryGenerationResponse:
    subscription = supabase.get_subscription(user.id)
    if subscription.video_credits_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits left. Upgrade or wait for the next billing cycle.",
        )
    nim = NvidiaNimClient(settings)
    scenes = await nim.generate_story(request)
    credits_left = supabase.decrement_credit_or_402(user.id)
    job_id = supabase.create_video_job(
        user_id=user.id,
        topic=request.topic,
        language=request.language,
        scenes=[scene.model_dump(mode="json") for scene in scenes],
    )

    pipeline = DocumentaryVideoPipeline(
        supabase=supabase,
        media=PublicMediaFetcher(settings),
        nim=nim,
        elevenlabs=ElevenLabsClient(settings),
        character_engine=CharacterCinematicsEngine(settings),
        renderer=RemotionRenderer(settings),
    )
    background_tasks.add_task(
        pipeline.run,
        job_id=job_id,
        topic=request.topic,
        language=request.language,
        scenes=scenes,
    )
    return StoryGenerationResponse(
        job_id=job_id,
        status="queued",
        credits_left=credits_left,
        scenes=scenes,
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase_service),
) -> JobStatusResponse:
    job = supabase.get_job(job_id, user.id)
    return JobStatusResponse(
        id=job["id"],
        status=job["status"],
        topic=job["topic"],
        language=job["language"],
        story_json=[StoryScene.model_validate(scene) for scene in job["story_json"]],
        asset_manifest=job.get("asset_manifest") or {},
        render_payload=job.get("render_payload") or {},
        final_video_url=job.get("final_video_url"),
        error_message=job.get("error_message"),
    )
