import logging
import time
from datetime import datetime, timezone

from app.config import get_settings
from app.database import get_supabase

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 60
_cache: dict[str, str] = {}
_cache_loaded_at: float = 0.0

ENV_FALLBACK_MAP = {
    "tavily_api_key": "tavily_api_key",
    "jina_api_key": "jina_api_key",
    "serper_api_key": "serper_api_key",
    "firecrawl_api_key": "firecrawl_api_key",
    "exa_api_key": "exa_api_key",
    "brave_search_api_key": "brave_search_api_key",
    "newsapi_key": "newsapi_key",
    "google_cse_api_key": "google_cse_api_key",
    "google_cse_cx": "google_cse_cx",
    "claude_api_key": "claude_api_key",
    "nvidia_nim_api_key": "nvidia_nim_api_key",
    "elevenlabs_api_key": "elevenlabs_api_key",
    "elevenlabs_voice_id": "elevenlabs_voice_id",
    "pexels_api_key": "pexels_api_key",
    "pixabay_api_key": "pixabay_api_key",
    "mapbox_access_token": "mapbox_access_token",
    "stripe_secret_key": "stripe_secret_key",
    "stripe_webhook_secret": "stripe_webhook_secret",
    "stripe_pro_price_id": "stripe_pro_price_id",
}

SCRAPER_DEFINITIONS = [
    {"id": "tavily", "toggle": "scraper_tavily_enabled", "key": "tavily_api_key", "label": "Tavily", "requires_key": True},
    {"id": "jina", "toggle": "scraper_jina_enabled", "key": "jina_api_key", "label": "Jina AI", "requires_key": True},
    {"id": "serper", "toggle": "scraper_serper_enabled", "key": "serper_api_key", "label": "Serper", "requires_key": True},
    {"id": "firecrawl", "toggle": "scraper_firecrawl_enabled", "key": "firecrawl_api_key", "label": "Firecrawl", "requires_key": True},
    {"id": "exa", "toggle": "scraper_exa_enabled", "key": "exa_api_key", "label": "Exa", "requires_key": True},
    {"id": "brave", "toggle": "scraper_brave_enabled", "key": "brave_search_api_key", "label": "Brave Search", "requires_key": True},
    {"id": "newsapi", "toggle": "scraper_newsapi_enabled", "key": "newsapi_key", "label": "NewsAPI", "requires_key": True},
    {"id": "google_cse", "toggle": "scraper_google_cse_enabled", "key": "google_cse_api_key", "label": "Google CSE", "requires_key": True},
    {"id": "wikipedia", "toggle": "scraper_wikipedia_enabled", "key": None, "label": "Wikipedia/Wikidata", "requires_key": False},
    {"id": "internet_archive", "toggle": "scraper_internet_archive_enabled", "key": None, "label": "Internet Archive", "requires_key": False},
]


def _load_settings_from_db() -> dict[str, str]:
    global _cache, _cache_loaded_at
    try:
        supabase = get_supabase()
        result = supabase.table("platform_settings").select("key, value").execute()
        db_settings = {row["key"]: row["value"] for row in (result.data or [])}
        _cache = db_settings
        _cache_loaded_at = time.time()
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


def get_scraper_status() -> list[dict]:
    status = []
    for scraper in SCRAPER_DEFINITIONS:
        enabled = get_platform_setting(scraper["toggle"], "true").lower() in ("true", "1", "yes")
        has_key = True
        if scraper["requires_key"] and scraper["key"]:
            has_key = bool(get_platform_setting(scraper["key"]))
        status.append({
            "id": scraper["id"],
            "label": scraper["label"],
            "enabled": enabled,
            "configured": has_key,
            "ready": enabled and (has_key or not scraper["requires_key"]),
        })
    return status


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
        if value is None:
            continue
        stripped = value.strip()
        if stripped == "" and not key.endswith("_enabled"):
            continue
        supabase.table("platform_settings").update(
            {
                "value": stripped,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": updated_by,
            }
        ).eq("key", key).execute()
    invalidate_settings_cache()
