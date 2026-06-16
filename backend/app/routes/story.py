from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db_session
from app.dependencies import get_app_settings, get_current_user
from app.models import User, VideoProject
from app.schemas import DashboardResponse, GenerateStoryRequest, GenerateStoryResponse, ProjectSummary, UserSummary
from app.services.llm import StoryGeneratorService
from app.services.media_pipeline import MediaPipelineService
from app.services.providers import ProviderClients
from app.workers.tasks import process_project_assets


router = APIRouter(prefix="/api", tags=["story"])


@router.post("/generate-story", response_model=GenerateStoryResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_story(
    payload: GenerateStoryRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_app_settings)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GenerateStoryResponse:
    if current_user.video_credits_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits left. Please upgrade your subscription.",
        )

    providers = ProviderClients(settings)
    story_service = StoryGeneratorService(providers)
    model, scenes = await story_service.generate_story(payload)

    current_user.video_credits_left -= 1
    project = VideoProject(
        user_id=current_user.id,
        topic=payload.topic,
        language=payload.language,
        status="queued_for_asset_pipeline",
        source_model=model,
        script_payload=[scene.model_dump(mode="json") for scene in scenes],
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    process_project_assets.delay(project.id)
    await db.refresh(current_user)

    return GenerateStoryResponse(
        project_id=project.id,
        status=project.status,
        source_model=model,
        credits_left=current_user.video_credits_left,
        scenes=scenes,
    )


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_app_settings)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> DashboardResponse:
    providers = ProviderClients(settings)
    pipeline = MediaPipelineService(settings, providers)
    projects = await pipeline.list_recent_projects(db, current_user.id)

    return DashboardResponse(
        user=UserSummary(
            id=current_user.id,
            email=current_user.email,
            plan_type=current_user.plan_type,
            video_credits_left=current_user.video_credits_left,
            billing_cycle_end=current_user.billing_cycle_end,
        ),
        recent_projects=[
            ProjectSummary(
                id=project.id,
                topic=project.topic,
                language=project.language,
                status=project.status,
                render_output_url=project.render_output_url,
                created_at=project.created_at,
            )
            for project in projects
        ],
    )
