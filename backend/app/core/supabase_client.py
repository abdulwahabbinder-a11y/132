"""Supabase client factory.

Two clients are exposed:

* ``get_supabase()`` — anon key, respects Row Level Security (RLS). Use for
  operations performed *as the authenticated user*.
* ``get_supabase_admin()`` — service-role key, bypasses RLS. Use only in trusted
  server-side flows (webhooks, credit accounting, worker pipeline).
"""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings
from app.core.logging import logger


@lru_cache
def get_supabase() -> Client:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("Supabase anon credentials are not configured.")
    logger.debug("Initialising Supabase anon client")
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_admin() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase service-role credentials are not configured.")
    logger.debug("Initialising Supabase service-role client")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


__all__ = ["get_supabase", "get_supabase_admin"]
