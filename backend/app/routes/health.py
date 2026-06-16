from __future__ import annotations

from fastapi import APIRouter, Depends

from app.config import Settings
from app.dependencies import get_app_settings
from app.schemas import HealthResponse


router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def healthcheck(settings: Settings = Depends(get_app_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        services={
            "database_url_configured": bool(settings.database_url),
            "stripe_configured": bool(settings.stripe_secret_key and settings.stripe_webhook_secret),
            "supabase_configured": bool(settings.supabase_url and settings.supabase_service_role_key),
            "nvidia_nim_configured": bool(settings.nvidia_nim_api_key),
            "elevenlabs_configured": bool(settings.elevenlabs_api_key),
        },
    )
