from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed runtime settings.

    All secrets are intentionally read from environment variables so this
    repository can be safely shared and deployed across environments.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    public_app_url: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"

    supabase_url: AnyHttpUrl
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_audience: str = "authenticated"

    stripe_secret_key: str
    stripe_webhook_secret: str

    nvidia_nim_api_key: str
    nvidia_nim_base_url: AnyHttpUrl = "https://integrate.api.nvidia.com/v1"
    nim_llama_model: str = "meta/llama-3.1-70b-instruct"
    nim_qwen_model: str = "qwen/qwen-2.5-72b-instruct"
    nim_flux_model: str = "stabilityai/flux-1-dev"
    nim_wan_model: str = "AnyFlow-Wan2.1-T2V-14B"
    nim_deepvideo_model: str = "DeepVideo-V1"

    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    pexels_api_key: str | None = None
    pixabay_api_key: str | None = None
    internet_archive_base_url: str = "https://archive.org/advancedsearch.php"
    wikimedia_user_agent: str = "ai-documentary-saas/1.0 (ops@example.com)"

    liveportrait_api_url: str | None = None
    remotion_project_path: Path = Path("../apps/remotion")
    render_output_dir: Path = Path("media/renders")
    asset_output_dir: Path = Path("media/assets")
    background_music_path: Path | None = Field(default=None)
    transition_sfx_dir: Path | None = Field(default=None)
    mapbox_access_token: str | None = None

    allowed_origins: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
