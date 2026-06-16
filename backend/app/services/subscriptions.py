"""Subscription & credit accounting backed by Supabase (service role)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.db.supabase_client import get_service_supabase

log = get_logger(__name__)

# In-memory fallback used when Supabase is not configured (local dev / tests).
_MEMORY_STORE: dict[str, dict] = {}


def _default_record(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "plan_type": "free",
        "stripe_customer_id": None,
        "stripe_subscription_id": None,
        "video_credits_left": settings.FREE_PLAN_CREDITS,
        "billing_cycle_end": None,
        "status": "active",
    }


def get_subscription(user_id: str) -> dict:
    sb = get_service_supabase()
    if sb is None:
        return _MEMORY_STORE.setdefault(user_id, _default_record(user_id))

    res = sb.table("subscriptions").select("*").eq("user_id", user_id).limit(1).execute()
    if res.data:
        return res.data[0]

    record = _default_record(user_id)
    sb.table("subscriptions").insert(record).execute()
    return record


def decrement_credit(user_id: str) -> int:
    """Atomically consume one credit. Returns the remaining balance."""
    sub = get_subscription(user_id)
    remaining = max(0, int(sub.get("video_credits_left", 0)) - 1)

    sb = get_service_supabase()
    if sb is None:
        _MEMORY_STORE[user_id]["video_credits_left"] = remaining
        return remaining

    sb.table("subscriptions").update({"video_credits_left": remaining}).eq(
        "user_id", user_id
    ).execute()
    return remaining


def refund_credit(user_id: str) -> int:
    """Return a credit (e.g. after a failed generation)."""
    sub = get_subscription(user_id)
    remaining = int(sub.get("video_credits_left", 0)) + 1

    sb = get_service_supabase()
    if sb is None:
        _MEMORY_STORE[user_id]["video_credits_left"] = remaining
        return remaining

    sb.table("subscriptions").update({"video_credits_left": remaining}).eq(
        "user_id", user_id
    ).execute()
    return remaining


def reset_credits_for_customer(stripe_customer_id: str, credits: int) -> Optional[str]:
    """Reset credits + activate Pro for the subscription matching a Stripe customer.

    Returns the affected user_id, or None if no match.
    """
    billing_cycle_end = datetime.now(timezone.utc) + timedelta(days=30)
    update = {
        "plan_type": "pro",
        "video_credits_left": credits,
        "billing_cycle_end": billing_cycle_end.isoformat(),
        "status": "active",
    }

    sb = get_service_supabase()
    if sb is None:
        for uid, rec in _MEMORY_STORE.items():
            if rec.get("stripe_customer_id") == stripe_customer_id:
                rec.update(update)
                return uid
        return None

    res = (
        sb.table("subscriptions")
        .update(update)
        .eq("stripe_customer_id", stripe_customer_id)
        .execute()
    )
    if res.data:
        return res.data[0]["user_id"]
    return None


def downgrade_to_free(stripe_customer_id: str) -> Optional[str]:
    """Revert a subscription to the free plan (e.g. on cancellation)."""
    update = {
        "plan_type": "free",
        "video_credits_left": settings.FREE_PLAN_CREDITS,
        "billing_cycle_end": None,
        "status": "canceled",
    }
    sb = get_service_supabase()
    if sb is None:
        for uid, rec in _MEMORY_STORE.items():
            if rec.get("stripe_customer_id") == stripe_customer_id:
                rec.update(update)
                return uid
        return None
    res = (
        sb.table("subscriptions")
        .update(update)
        .eq("stripe_customer_id", stripe_customer_id)
        .execute()
    )
    return res.data[0]["user_id"] if res.data else None


def attach_stripe_customer(user_id: str, stripe_customer_id: str) -> None:
    sb = get_service_supabase()
    if sb is None:
        _MEMORY_STORE.setdefault(user_id, _default_record(user_id))[
            "stripe_customer_id"
        ] = stripe_customer_id
        return
    sb.table("subscriptions").update({"stripe_customer_id": stripe_customer_id}).eq(
        "user_id", user_id
    ).execute()
