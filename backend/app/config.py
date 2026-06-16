"""Centralised application configuration.

All settings are sourced from environment variables (see ``backend/.env.example``).
Using ``pydantic-settings`` gives us typed, validated configuration with sensible
defaults so the app boots even when optional integrations are not configured.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- App ---
    app_name: str = "DocuForge AI"
    environment: str = "development"
    api_prefix: str = "/api"
    frontend_url: str = "http://localhost:3000"
    secret_key: str = "change-me-in-production"
    storage_dir: str = "./storage"

    # --- Supabase ---
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # --- Celery / Redis ---
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # --- Stripe ---
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id_pro: str = ""
    default_pro_credits: int = 30

    # --- NVIDIA NIM ---
    nvidia_nim_api_key: str = ""
    nvidia_nim_base_url: str = "https://integrate.api.nvidia.com/v1"
    nim_model_llama: str = "meta/llama-3.1-70b-instruct"
    nim_model_qwen: str = "qwen/qwen-2.5-72b-instruct"
    nim_model_flux: str = "stabilityai/flux-1-dev"
    nim_model_wan: str = "AnyFlow-Wan2.1-T2V-14B"

    # --- ElevenLabs ---
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    elevenlabs_model_id: str = "eleven_multilingual_v2"

    # --- Character cinematics ---
    liveportrait_endpoint: str = ""
    deepvideo_v1_endpoint: str = ""

    # --- Public media APIs ---
    pexels_api_key: str = ""
    pixabay_api_key: str = ""
    wikimedia_user_agent: str = "DocuForgeAI/1.0 (contact@docuforge.ai)"

    # --- Maps ---
    mapbox_access_token: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [self.frontend_url, "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance."""
    return Settings()


settings = get_settings()
