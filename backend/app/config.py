from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DocuAI Platform"
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production-use-32-char-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str
    DATABASE_URL: str  # postgresql+asyncpg://...

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_PRO_PRICE_ID: str
    STRIPE_PRO_PLAN_CREDITS: int = 30

    # NVIDIA NIM
    NVIDIA_API_KEY: str
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

    # ElevenLabs
    ELEVENLABS_API_KEY: str
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel - default narrator

    # Media APIs
    PEXELS_API_KEY: str
    PIXABAY_API_KEY: str
    WIKIMEDIA_USER_AGENT: str = "DocuAI/1.0 (contact@docuai.com)"

    # Mapbox
    MAPBOX_ACCESS_TOKEN: str

    # LivePortrait / DeepVideo
    DEEPVIDEO_API_KEY: Optional[str] = None
    DEEPVIDEO_API_URL: Optional[str] = None
    LIVEPORTRAIT_API_URL: Optional[str] = None

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Storage
    STORAGE_BUCKET: str = "docuai-assets"
    OUTPUT_DIR: str = "/tmp/docuai/output"
    ASSETS_DIR: str = "/tmp/docuai/assets"

    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
