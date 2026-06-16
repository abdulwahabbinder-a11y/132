from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_name: str = "AI Documentary Video Generator API"
    api_v1_prefix: str = "/api"
    web_origin: AnyHttpUrl = "http://localhost:3000"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/docgen"

    supabase_url: AnyHttpUrl = "https://example.supabase.co"
    supabase_anon_key: SecretStr = SecretStr("anon-placeholder")
    supabase_service_role_key: SecretStr = SecretStr("service-role-placeholder")
    supabase_jwt_secret: SecretStr = SecretStr("jwt-placeholder")

    default_free_video_credits: int = 3
    pro_plan_video_credits: int = 30

    stripe_secret_key: SecretStr = SecretStr("sk_test_placeholder")
    stripe_webhook_secret: SecretStr = SecretStr("whsec_placeholder")
    stripe_price_id_pro: str = "price_placeholder"

    nvidia_nim_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_nim_api_key: SecretStr = SecretStr("nim-placeholder")
    elevenlabs_api_key: SecretStr = SecretStr("elevenlabs-placeholder")
    elevenlabs_voice_id: str = "EXAVITQu4vr4xnSDxMaL"
    pexels_api_key: SecretStr = SecretStr("pexels-placeholder")
    pixabay_api_key: SecretStr = SecretStr("pixabay-placeholder")
    mapbox_access_token: SecretStr = SecretStr("mapbox-placeholder")

    media_storage_root: Path = Path("storage")
    remotion_entry: str = "../../packages/video-composer/src/Root.tsx"
    remotion_composition_id: str = "DocumentaryTimeline"

    request_timeout_seconds: int = 90
    scene_clip_duration_seconds: int = 4
    remotion_fps: int = 30

    @property
    def media_storage_root_abs(self) -> Path:
        return self.media_storage_root.resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
