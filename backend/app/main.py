import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import stripe
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.security import get_current_user_id
from app.db.supabase import fetch_one, get_supabase_client
from app.schemas.story import StoryGenerationRequest, StoryGenerationResponse
from app.services.llm_router import generate_story_scenes
from app.services.remotion_service import build_audio_ducking_ffmpeg_command, render_remotion_composition
from app.services.stripe_service import build_checkout_url, reset_user_credits_for_subscription
from app.workers.scene_asset_worker import process_scene_assets

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

app = FastAPI(title="AI Documentary Generator API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(default="")) -> dict[str, str]:
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.stripe_webhook_secret)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature") from exc

    if event["type"] == "customer.subscription.created":
        customer_id = event["data"]["object"]["customer"]
        reset_user_credits_for_subscription(customer_id)

    return {"received": "true"}


@app.post("/api/generate-story", response_model=StoryGenerationResponse)
async def generate_story(
    request_data: StoryGenerationRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
) -> StoryGenerationResponse:
    supabase = get_supabase_client()
    user = fetch_one("users", {"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.get("video_credits_left", 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits left. Upgrade to Pro or wait for renewal.",
        )

    model, scenes = await generate_story_scenes(
        topic=request_data.topic,
        language=request_data.language,
        tone=request_data.tone,
        target_minutes=request_data.target_minutes,
    )

    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("projects").insert(
        {
            "id": project_id,
            "user_id": user_id,
            "topic": request_data.topic,
            "script_language": request_data.language,
            "scenes_json": [scene.model_dump() for scene in scenes],
            "status": "queued",
            "created_at": now,
        }
    ).execute()
    supabase.table("users").update({"video_credits_left": user["video_credits_left"] - 1}).eq("id", user_id).execute()

    background_tasks.add_task(run_project_pipeline, project_id, scenes)
    return StoryGenerationResponse(
        project_id=project_id,
        language_model=model,
        scenes=scenes,
        video_credits_left=user["video_credits_left"] - 1,
    )


@app.get("/api/projects")
async def list_projects(user_id: str = Depends(get_current_user_id)) -> list[dict[str, Any]]:
    supabase = get_supabase_client()
    response = (
        supabase.table("projects")
        .select("id,topic,status,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )
    return response.data or []


@app.get("/api/stripe/checkout-url")
async def get_stripe_checkout_url(user_id: str = Depends(get_current_user_id)) -> dict[str, str]:
    user = fetch_one("users", {"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    checkout_url = build_checkout_url(settings.stripe_pro_price_id, user["email"])
    return {"checkout_url": checkout_url}


async def run_project_pipeline(project_id: str, scenes: list[Any]) -> None:
    supabase = get_supabase_client()
    try:
        scene_results = await asyncio.gather(
            *[process_scene_assets(project_id, scene) for scene in scenes],
            return_exceptions=False,
        )
        remotion_payload = {
            "projectId": project_id,
            "aspectRatio": "21:9",
            "scenes": scene_results,
            "subtitlePlacement": "center-bottom",
            "mapProvider": "mapbox",
        }
        render_output = await render_remotion_composition(project_id, remotion_payload)
        ffmpeg_ducking_cmd = build_audio_ducking_ffmpeg_command(
            voice_track=Path("generated") / project_id / "voice_mix.mp3",
            bgm_track=Path("assets/music/documentary-bed.mp3"),
            sfx_track=Path("assets/sfx/whoosh-boom.mp3"),
            rendered_video=Path(str(render_output.get("output_location", ""))),
            output_path=Path("generated") / project_id / "final-21x9.mp4",
        )
        supabase.table("projects").update(
            {
                "status": "completed",
                "result_json": {**render_output, "ffmpeg_audio_ducking_command": ffmpeg_ducking_cmd},
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", project_id).execute()
    except Exception as exc:  # noqa: BLE001
        supabase.table("projects").update(
            {"status": "failed", "error_message": str(exc), "updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", project_id).execute()
