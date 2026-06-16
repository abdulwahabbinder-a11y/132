"""Stripe billing: checkout sessions, billing portal, webhook handling."""

from __future__ import annotations

from datetime import datetime, timezone

import stripe

from app.config import settings
from app.core.logging import logger
from app.core.supabase_client import get_supabase_admin
from app.models.subscription import PlanType
from app.models.user import User


def _configure() -> None:
    if not settings.stripe_secret_key:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured.")
    stripe.api_key = settings.stripe_secret_key


def create_checkout_session(user: User) -> str:
    """Create a Stripe Checkout session for the Pro plan; return the URL."""
    _configure()
    if not settings.stripe_price_id_pro:
        raise RuntimeError("STRIPE_PRICE_ID_PRO is not configured.")

    session = stripe.checkout.Session.create(
        mode="subscription",
        client_reference_id=user.id,
        customer_email=user.email,
        line_items=[{"price": settings.stripe_price_id_pro, "quantity": 1}],
        success_url=f"{settings.frontend_url}/dashboard?checkout=success",
        cancel_url=f"{settings.frontend_url}/pricing?checkout=cancelled",
        metadata={"user_id": user.id},
        subscription_data={"metadata": {"user_id": user.id}},
    )
    logger.info("Created checkout session for user {}", user.id)
    return session.url


def create_billing_portal(user: User) -> str:
    """Create a Stripe billing portal session for an existing customer."""
    _configure()
    db = get_supabase_admin()
    resp = (
        db.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    customer_id = resp.data[0]["stripe_customer_id"] if resp.data else None
    if not customer_id:
        raise RuntimeError("No Stripe customer on file for this user.")

    portal = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.frontend_url}/dashboard",
    )
    return portal.url


def construct_event(payload: bytes, signature: str) -> stripe.Event:
    """Verify the webhook signature and return the Stripe event."""
    _configure()
    if not settings.stripe_webhook_secret:
        raise RuntimeError("STRIPE_WEBHOOK_SECRET is not configured.")
    return stripe.Webhook.construct_event(
        payload, signature, settings.stripe_webhook_secret
    )


def handle_subscription_created(event: stripe.Event) -> None:
    """On 'customer.subscription.created' upgrade the user and reset credits to 30."""
    obj = event["data"]["object"]
    user_id = (obj.get("metadata") or {}).get("user_id")
    customer_id = obj.get("customer")
    subscription_id = obj.get("id")
    period_end = obj.get("current_period_end")

    if not user_id:
        # Fall back to resolving via the customer's metadata.
        user_id = _resolve_user_from_customer(customer_id)
    if not user_id:
        logger.warning("subscription.created without resolvable user_id; skipping")
        return

    billing_cycle_end = (
        datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat()
        if period_end
        else None
    )

    db = get_supabase_admin()
    db.table("subscriptions").upsert(
        {
            "user_id": user_id,
            "plan_type": PlanType.PRO.value,
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id,
            "video_credits_left": settings.default_pro_credits,  # reset to 30
            "billing_cycle_end": billing_cycle_end,
        },
        on_conflict="user_id",
    ).execute()
    logger.info(
        "Pro activated for user {}; credits reset to {}",
        user_id,
        settings.default_pro_credits,
    )


def handle_subscription_deleted(event: stripe.Event) -> None:
    """On cancellation downgrade the user back to the free plan."""
    obj = event["data"]["object"]
    user_id = (obj.get("metadata") or {}).get("user_id") or _resolve_user_from_customer(
        obj.get("customer")
    )
    if not user_id:
        return
    db = get_supabase_admin()
    db.table("subscriptions").update(
        {"plan_type": PlanType.FREE.value, "stripe_subscription_id": None}
    ).eq("user_id", user_id).execute()
    logger.info("Downgraded user {} to free", user_id)


def _resolve_user_from_customer(customer_id: str | None) -> str | None:
    if not customer_id:
        return None
    db = get_supabase_admin()
    resp = (
        db.table("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customer_id)
        .limit(1)
        .execute()
    )
    return resp.data[0]["user_id"] if resp.data else None
