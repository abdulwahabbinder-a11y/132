"""Centralised application configuration loaded from environment variables.

All secrets and tunables flow through this single ``Settings`` object so that
the rest of the codebase never reads ``os.environ`` directly.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ----- General -----
    ENVIRONMENT: str = "development"
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    BACKEND_CORS_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # ----- Supabase -----
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""
    SUPABASE_STORAGE_BUCKET: str = "documentaries"

    # ----- Stripe -----
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_ID_PRO: str = ""
    PRO_PLAN_MONTHLY_CREDITS: int = 30

    # ----- NVIDIA NIM -----
    NVIDIA_NIM_API_KEY: str = ""
    NVIDIA_NIM_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NIM_LLM_MODEL_EN: str = "meta/llama-3.1-70b-instruct"
    NIM_LLM_MODEL_INTL: str = "qwen/qwen-2.5-72b-instruct"
    NIM_IMAGE_MODEL: str = "stabilityai/flux-1-dev"
    NIM_VIDEO_MODEL: str = "AnyFlow-Wan2.1-T2V-14B"

    # ----- ElevenLabs -----
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    ELEVENLABS_MODEL_ID: str = "eleven_multilingual_v2"

    # ----- Scrapers -----
    PEXELS_API_KEY: str = ""
    PIXABAY_API_KEY: str = ""
    WIKIMEDIA_USER_AGENT: str = "DocuForgeAI/1.0 (contact@docuforge.ai)"

    # ----- Character cinematics -----
    LIVEPORTRAIT_ENDPOINT: str = ""
    DEEPVIDEO_V1_ENDPOINT: str = ""

    # ----- Maps -----
    MAPBOX_ACCESS_TOKEN: str = ""

    # ----- Async infra -----
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # ----- Rendering -----
    REMOTION_PROJECT_DIR: str = "../remotion"
    RENDER_OUTPUT_DIR: str = "./storage/renders"
    FFMPEG_BINARY: str = "ffmpeg"

    # ----- Defaults -----
    FREE_PLAN_CREDITS: int = 3

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, v):  # noqa: D401
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def has_nim(self) -> bool:
        return bool(self.NVIDIA_NIM_API_KEY)


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton ``Settings`` instance."""
    return Settings()


settings = get_settings()
