from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    supabase_url: str = Field(alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(alias="SUPABASE_JWT_SECRET")

    stripe_secret_key: str = Field(alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field(alias="STRIPE_WEBHOOK_SECRET")
    stripe_pro_price_id: str = Field(alias="STRIPE_PRO_PRICE_ID")

    nvidia_nim_api_key: str = Field(alias="NVIDIA_NIM_API_KEY")
    elevenlabs_api_key: str = Field(alias="ELEVENLABS_API_KEY")
    pexels_api_key: str = Field(alias="PEXELS_API_KEY")
    pixabay_api_key: str = Field(alias="PIXABAY_API_KEY")

    internet_archive_base_url: str = Field(alias="INTERNET_ARCHIVE_BASE_URL")
    wikimedia_commons_api: str = Field(alias="WIKIMEDIA_COMMONS_API")
    wikipedia_api: str = Field(alias="WIKIPEDIA_API")
    wikidata_api: str = Field(alias="WIKIDATA_API")

    mapbox_token: str = Field(alias="MAPBOX_TOKEN")
    remotion_render_endpoint: str = Field(alias="REMOTION_RENDER_ENDPOINT")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
