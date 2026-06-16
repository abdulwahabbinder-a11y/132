"""Lazy Supabase client singletons (service-role + anon)."""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from .config import settings


@lru_cache(maxsize=1)
def get_supabase_service() -> Client:
    """Server-side Supabase client (full RLS bypass)."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase service role credentials are not configured.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache(maxsize=1)
def get_supabase_anon() -> Client:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("Supabase anon credentials are not configured.")
    return create_client(settings.supabase_url, settings.supabase_anon_key)
