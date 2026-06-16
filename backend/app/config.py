from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Documentary Video Generator API"
    app_env: str = "development"
    app_url: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/aidoc",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(default="", alias="SUPABASE_JWT_SECRET")

    stripe_secret_key: str = Field(default="", alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field(default="", alias="STRIPE_WEBHOOK_SECRET")

    nvidia_nim_base_url: str = Field(
        default="https://integrate.api.nvidia.com/v1",
        alias="NVIDIA_NIM_BASE_URL",
    )
    nvidia_nim_api_key: str = Field(default="", alias="NVIDIA_NIM_API_KEY")
    elevenlabs_api_key: str = Field(default="", alias="ELEVENLABS_API_KEY")
    pexels_api_key: str = Field(default="", alias="PEXELS_API_KEY")
    pixabay_api_key: str = Field(default="", alias="PIXABAY_API_KEY")
    wikimedia_user_agent: str = Field(
        default="AiDocumentaryPlatform/1.0 (contact@example.com)",
        alias="WIKIMEDIA_USER_AGENT",
    )

    deepvideo_base_url: str = Field(default="", alias="DEEVIDEO_BASE_URL")
    deepvideo_api_key: str = Field(default="", alias="DEEVIDEO_API_KEY")
    liveportrait_base_url: str = Field(default="", alias="LIVEPORTRAIT_BASE_URL")
    liveportrait_api_key: str = Field(default="", alias="LIVEPORTRAIT_API_KEY")

    ffmpeg_bin: str = Field(default="ffmpeg", alias="FFMPEG_BIN")
    remotion_entry: str = Field(default="../frontend/src/remotion/index.ts", alias="REMOTION_ENTRY")
    remotion_composition_id: str = Field(
        default="DocumentaryComposition",
        alias="REMOTION_COMPOSITION_ID",
    )
    storage_path: Path = Path("storage")

    free_video_credits: int = 3
    pro_video_credits: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
