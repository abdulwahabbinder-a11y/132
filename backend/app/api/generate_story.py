import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription
from app.models.video_project import VideoProject, VideoScene, VideoStatus, VideoLanguage, AspectRatio
from app.api.auth import get_current_user
from app.services.llm_service import LLMService
from app.workers.media_worker import process_project_media

router = APIRouter()
settings = get_settings()


# ── Schemas ────────────────────────────────────────────────────────────────────

class StoryRequest(BaseModel):
    topic: str
    language: VideoLanguage = VideoLanguage.ENGLISH
    style: str = "documentary"  # documentary | explainer | vox
    aspect_ratio: AspectRatio = AspectRatio.CINEMATIC
    num_scenes: int = 8  # 5–15


class SceneOut(BaseModel):
    scene_number: int
    narration_text: str
    visual_keywords: list[str]
    is_abstract_scene: bool
    is_historical_character: bool
    character_name: str | None
    location_coordinates: dict | None


class StoryResponse(BaseModel):
    project_id: uuid.UUID
    title: str
    status: VideoStatus
    total_scenes: int
    scenes: list[SceneOut]
    credits_remaining: int


# ── Route ──────────────────────────────────────────────────────────────────────

@router.post("", response_model=StoryResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_story(
    payload: StoryRequest,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a documentary script and kick off the full media + video pipeline.
    Requires video_credits_left > 0.
    """
    # ── Credit check ──────────────────────────────────────────────────────────
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = result.scalar_one_or_none()
    if not subscription or not subscription.has_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits remaining. Please upgrade your plan.",
        )

    # ── LLM script generation ─────────────────────────────────────────────────
    llm_service = LLMService()
    script = await llm_service.generate_documentary_script(
        topic=payload.topic,
        language=payload.language,
        style=payload.style,
        num_scenes=payload.num_scenes,
    )

    title = script.get("title", payload.topic[:80])
    scenes_data: list[dict] = script.get("scenes", [])

    # ── Persist project ───────────────────────────────────────────────────────
    project = VideoProject(
        user_id=current_user.id,
        title=title,
        topic=payload.topic,
        language=payload.language,
        style=payload.style,
        aspect_ratio=payload.aspect_ratio,
        status=VideoStatus.SCRIPTING,
        script_json=script,
        total_scenes=len(scenes_data),
    )
    db.add(project)
    await db.flush()

    scene_objects: list[VideoScene] = []
    for s in scenes_data:
        scene = VideoScene(
            project_id=project.id,
            scene_number=s["scene_number"],
            narration_text=s["narration_text"],
            visual_keywords=s.get("visual_keywords", []),
            is_abstract_scene=s.get("is_abstract_scene", False),
            is_historical_character=s.get("is_historical_character", False),
            character_name=s.get("character_name"),
            location_coordinates=s.get("location_coordinates"),
        )
        db.add(scene)
        scene_objects.append(scene)

    # ── Deduct credit ─────────────────────────────────────────────────────────
    subscription.video_credits_left -= 1
    await db.commit()
    await db.refresh(project)

    # ── Kick off background pipeline ──────────────────────────────────────────
    background_tasks.add_task(process_project_media, str(project.id))

    return StoryResponse(
        project_id=project.id,
        title=title,
        status=VideoStatus.SCRIPTING,
        total_scenes=len(scenes_data),
        scenes=[
            SceneOut(
                scene_number=s["scene_number"],
                narration_text=s["narration_text"],
                visual_keywords=s.get("visual_keywords", []),
                is_abstract_scene=s.get("is_abstract_scene", False),
                is_historical_character=s.get("is_historical_character", False),
                character_name=s.get("character_name"),
                location_coordinates=s.get("location_coordinates"),
            )
            for s in scenes_data
        ],
        credits_remaining=subscription.video_credits_left,
    )
