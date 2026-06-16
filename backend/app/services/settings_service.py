import logging
import time
from functools import lru_cache

from app.config import get_settings
from app.database import get_supabase

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 60
_cache: dict[str, str] = {}
_cache_loaded_at: float = 0.0

ENV_FALLBACK_MAP = {
    "tavily_api_key": "tavily_api_key",
    "jina_api_key": "jina_api_key",
    "nvidia_nim_api_key": "nvidia_nim_api_key",
    "elevenlabs_api_key": "elevenlabs_api_key",
    "elevenlabs_voice_id": "elevenlabs_voice_id",
    "pexels_api_key": "pexels_api_key",
    "pixabay_api_key": "pixabay_api_key",
    "mapbox_access_token": "mapbox_access_token",
    "tavily_api_key": "tavily_api_key",
    "jina_api_key": "jina_api_key",
    "stripe_secret_key": "stripe_secret_key",
    "stripe_webhook_secret": "stripe_webhook_secret",
    "stripe_pro_price_id": "stripe_pro_price_id",
}


def _load_settings_from_db() -> dict[str, str]:
    global _cache, _cache_loaded_at
    try:
        supabase = get_supabase()
        result = supabase.table("platform_settings").select("key, value").execute()
        db_settings = {row["key"]: row["value"] for row in (result.data or [])}
        _cache = db_settings
        _cache_loaded_at = time.time()
        logger.debug("Loaded %d platform settings from Supabase", len(db_settings))
        return db_settings
    except Exception as exc:
        logger.warning("Failed to load platform settings from DB: %s", exc)
        return _cache


def invalidate_settings_cache() -> None:
    global _cache_loaded_at
    _cache_loaded_at = 0.0


def get_platform_setting(key: str, default: str = "") -> str:
    global _cache_loaded_at
    if time.time() - _cache_loaded_at > _CACHE_TTL_SECONDS:
        _load_settings_from_db()

    value = _cache.get(key, "")
    if value:
        return value

    settings = get_settings()
    env_attr = ENV_FALLBACK_MAP.get(key, key)
    env_value = getattr(settings, env_attr, default)
    return env_value or default


def get_all_settings_for_admin() -> list[dict]:
    supabase = get_supabase()
    result = (
        supabase.table("platform_settings")
        .select("key, value, category, label, is_secret, updated_at")
        .order("category")
        .order("key")
        .execute()
    )
    rows = result.data or []
    for row in rows:
        if row.get("is_secret") and row.get("value"):
            val = row["value"]
            row["value_masked"] = val[:4] + "•" * min(12, max(0, len(val) - 4))
        else:
            row["value_masked"] = row.get("value", "")
    return rows


def update_platform_settings(updates: dict[str, str], updated_by: str) -> None:
    supabase = get_supabase()
    for key, value in updates.items():
        if not value or value.strip() == "":
            continue
        supabase.table("platform_settings").update(
            {
                "value": value.strip(),
                "updated_at": "now()",
                "updated_by": updated_by,
            }
        ).eq("key", key).execute()
    invalidate_settings_cache()
