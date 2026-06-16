"""Centralised application settings, loaded from environment via Pydantic."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ Core
    app_env: Literal["development", "staging", "production"] = "development"
    app_port: int = 8000
    app_base_url: str = "http://localhost:8000"
    frontend_base_url: str = "http://localhost:3000"
    secret_key: str = "change-me"

    # -------------------------------------------------------------- Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # ---------------------------------------------------------------- Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    pro_plan_credits: int = 30
    free_plan_credits: int = 3

    # ------------------------------------------------------------ NVIDIA NIM
    nvidia_nim_api_key: str = ""
    nvidia_nim_base_url: str = "https://integrate.api.nvidia.com/v1"
    nim_model_llama: str = "meta/llama-3.1-70b-instruct"
    nim_model_qwen: str = "qwen/qwen-2.5-72b-instruct"
    nim_model_flux: str = "stabilityai/flux-1-dev"
    nim_model_wan21: str = "anyflow/wan2.1-t2v-14b"
    nim_model_deepvideo: str = "deepvideo-v1"
    nim_model_liveportrait: str = "liveportrait-v1"

    # ----------------------------------------------------------- ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    elevenlabs_model_id: str = "eleven_multilingual_v2"

    # ------------------------------------------------------------- Scrapers
    pexels_api_key: str = ""
    pixabay_api_key: str = ""

    # ----------------------------------------------------------------- Maps
    mapbox_access_token: str = ""

    # -------------------------------------------------------------- Storage
    storage_bucket: str = "documentary-videos"
    storage_endpoint: str = ""
    storage_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # ---------------------------------------------------- Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # --------------------------------------------------------- Remotion
    remotion_renderer_url: str = "http://localhost:3030"
    remotion_bundle_path: str = "/app/remotion"

    # --------------------------------------------------------- FFmpeg
    ffmpeg_bin: str = "ffmpeg"
    ffprobe_bin: str = "ffprobe"
    audio_duck_db: int = Field(default=-15, description="dB drop applied to music when narration is active")


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — avoids re-parsing env per request."""
    return Settings()


settings = get_settings()
