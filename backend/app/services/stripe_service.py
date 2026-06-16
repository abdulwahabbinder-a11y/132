from datetime import datetime, timezone

import stripe
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.db.supabase import fetch_one, get_supabase_client


def initialize_stripe() -> None:
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key


def build_checkout_url(price_id: str, customer_email: str) -> str:
    initialize_stripe()
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        customer_email=customer_email,
        success_url="https://example.com/dashboard?checkout=success",
        cancel_url="https://example.com/pricing?checkout=cancelled",
    )
    return str(session.url)


def reset_user_credits_for_subscription(customer_id: str) -> None:
    supabase = get_supabase_client()
    user = fetch_one("users", {"stripe_customer_id": customer_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user found for Stripe customer: {customer_id}",
        )

    now = datetime.now(timezone.utc).isoformat()
    supabase.table("users").update({"video_credits_left": 30}).eq("id", user["id"]).execute()
    supabase.table("subscriptions").upsert(
        {
            "user_id": user["id"],
            "plan_type": "pro",
            "stripe_customer_id": customer_id,
            "video_credits_left": 30,
            "billing_cycle_end": now,
            "updated_at": now,
        },
        on_conflict="user_id",
    ).execute()
