from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def fetch_one(table: str, filters: dict[str, Any]) -> dict[str, Any] | None:
    client = get_supabase_client()
    query = client.table(table).select("*")
    for key, value in filters.items():
        query = query.eq(key, value)
    response = query.limit(1).execute()
    if not response.data:
        return None
    return response.data[0]
