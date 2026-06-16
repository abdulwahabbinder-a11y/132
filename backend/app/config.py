from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "DocuForge AI"
    debug: bool = False
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:3000,https://docuforge.pro,https://www.docuforge.pro"
    frontend_url: str = "https://docuforge.pro"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""

    # NVIDIA NIM
    nvidia_nim_api_key: str = ""
    nvidia_nim_base_url: str = "https://integrate.api.nvidia.com/v1"

    # ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"

    # Media APIs
    pexels_api_key: str = ""
    pixabay_api_key: str = ""
    mapbox_access_token: str = ""
    tavily_api_key: str = ""
    jina_api_key: str = ""
    serper_api_key: str = ""
    firecrawl_api_key: str = ""
    exa_api_key: str = ""
    brave_search_api_key: str = ""
    newsapi_key: str = ""
    claude_api_key: str = ""

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # Storage
    asset_storage_path: str = "/tmp/docuforge/assets"
    output_storage_path: str = "/tmp/docuforge/output"

    # Credits — 5 credits = 1 rendered video
    credits_per_video: int = 5
    pro_plan_monthly_credits: int = 30
    free_plan_credits: int = 5

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
