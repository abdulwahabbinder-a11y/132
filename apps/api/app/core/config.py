from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    api_base_url: str = "http://localhost:8000"

    supabase_url: str = ""
    supabase_service_role_key: str = ""

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    nvidia_nim_api_key: str = ""
    nvidia_nim_base_url: AnyHttpUrl = "https://integrate.api.nvidia.com/v1"
    nvidia_nim_llama_model: str = "meta/llama-3.1-70b-instruct"
    nvidia_nim_qwen_model: str = "qwen/qwen-2.5-72b-instruct"
    nvidia_nim_flux_model: str = "stabilityai/flux-1-dev"
    nvidia_nim_wan_model: str = "AnyFlow-Wan2.1-T2V-14B"

    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    pexels_api_key: str = ""
    pixabay_api_key: str = ""
    internet_archive_base_url: AnyHttpUrl = "https://archive.org/advancedsearch.php"
    wikimedia_api_base_url: AnyHttpUrl = "https://commons.wikimedia.org/w/api.php"
    wikipedia_api_base_url: AnyHttpUrl = "https://en.wikipedia.org/w/api.php"
    wikidata_sparql_url: AnyHttpUrl = "https://query.wikidata.org/sparql"

    liveportrait_url: str = ""
    deepvideo_v1_url: str = ""

    remotion_project_path: Path = Path("packages/remotion")
    render_output_dir: Path = Path("renders")
    mapbox_token: str = ""

    request_timeout_seconds: float = Field(default=60.0, ge=5.0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
