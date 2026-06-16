"""Typed application settings powered by pydantic-settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    log_level: str = "info"
    backend_base_url: str = "http://localhost:8000"
    frontend_base_url: str = "http://localhost:3000"

    # Supabase / Postgres
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/docugen"

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_free: str = "price_free"
    stripe_price_pro: str = "price_pro_29"
    pro_plan_credits: int = 30
    free_plan_credits: int = 3

    # NVIDIA NIM
    nvidia_nim_api_key: str = ""
    nvidia_nim_base_url: str = "https://integrate.api.nvidia.com/v1"
    nim_model_en: str = "meta/llama-3.1-70b-instruct"
    nim_model_hi: str = "qwen/qwen-2.5-72b-instruct"
    nim_model_flux: str = "stabilityai/flux-1-dev"
    nim_model_wan: str = "AnyFlow-Wan2.1-T2V-14B"
    nim_model_liveportrait: str = "KwaiVGI/liveportrait"
    nim_model_deepvideo: str = "deepvideo/deepvideo-v1"

    # Media APIs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    pexels_api_key: str = ""
    pixabay_api_key: str = ""
    mapbox_token: str = ""

    # Background jobs
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # Storage
    storage_root: Path = Field(default=Path("./storage"))
    supabase_storage_bucket: str = "documentary-output"

    # Rendering
    remotion_entry: str = "../remotion/src/index.ts"
    output_aspect_ratio: str = "21:9"
    output_width: int = 2560
    output_height: int = 1080
    output_fps: int = 30


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
