from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = Field(..., alias="DATABASE_URL")

    supabase_url: AnyHttpUrl = Field(..., alias="SUPABASE_URL")
    supabase_anon_key: str = Field(..., alias="SUPABASE_ANON_KEY")
    supabase_jwt_secret: str = Field(..., alias="SUPABASE_JWT_SECRET")

    stripe_secret_key: str = Field(..., alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field(..., alias="STRIPE_WEBHOOK_SECRET")
    stripe_pro_price_id: str = Field(..., alias="STRIPE_PRO_PRICE_ID")

    nim_base_url: str = Field(..., alias="NIM_BASE_URL")
    nim_api_key: str = Field(..., alias="NIM_API_KEY")
    nim_model_english: str = Field("meta/llama-3.1-70b-instruct", alias="NIM_MODEL_ENGLISH")
    nim_model_regional: str = Field("qwen/qwen-2.5-72b-instruct", alias="NIM_MODEL_REGIONAL")
    nim_model_flux: str = Field("stabilityai/flux-1-dev", alias="NIM_MODEL_FLUX")
    nim_model_wan: str = Field("AnyFlow-Wan2.1-T2V-14B", alias="NIM_MODEL_WAN")
    nim_model_deepvideo: str = Field("DeepVideo-V1", alias="NIM_MODEL_DEEPVIDEO")

    pexels_api_key: str = Field("", alias="PEXELS_API_KEY")
    pixabay_api_key: str = Field("", alias="PIXABAY_API_KEY")
    elevenlabs_api_key: str = Field("", alias="ELEVENLABS_API_KEY")
    elevenlabs_voice_id: str = Field("21m00Tcm4TlvDq8ikWAM", alias="ELEVENLABS_VOICE_ID")
    liveportrait_api_url: str = Field("", alias="LIVEPORTRAIT_API_URL")
    mapbox_access_token: str = Field("", alias="MAPBOX_ACCESS_TOKEN")

    background_music_path: str = Field("", alias="BACKGROUND_MUSIC_PATH")
    transition_whoosh_path: str = Field("", alias="TRANSITION_WHOOSH_PATH")
    transition_boom_path: str = Field("", alias="TRANSITION_BOOM_PATH")


@lru_cache
def get_settings() -> Settings:
    return Settings()
