"""Supabase client factories.

We expose two clients:
    * `supabase_anon`     — public/anon key, used for user-scoped requests
                            (RLS enforced).
    * `supabase_admin`    — service-role key, bypasses RLS for trusted server
                            operations such as Stripe webhook reconciliation.
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


@lru_cache
def supabase_admin() -> Client:
    """Service-role client (DO NOT expose to frontend)."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase service-role credentials are not configured.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache
def supabase_anon() -> Client:
    """Anon-key client. RLS policies must allow the requested operation."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("Supabase anon credentials are not configured.")
    return create_client(settings.supabase_url, settings.supabase_anon_key)
