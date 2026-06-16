"""Supabase client factories.

Two clients are exposed:

* ``get_supabase()`` — anon-key client used for user-scoped reads where RLS
  applies.
* ``get_service_supabase()`` — service-role client used by trusted server code
  (webhooks, workers) to bypass RLS for credit accounting and job updates.
"""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


@lru_cache
def get_supabase() -> Client | None:
    if not (settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY):
        log.warning("supabase.not_configured", scope="anon")
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache
def get_service_supabase() -> Client | None:
    if not (settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY):
        log.warning("supabase.not_configured", scope="service")
        return None
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
