"""Stripe webhook receiver.

Handles `customer.subscription.created` (resets the user's `video_credits_left`
to PRO_PLAN_CREDITS = 30) as well as cancellation + renewal events.
"""

from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Header, HTTPException, Request, status
from loguru import logger

from app.config import settings
from app.database import supabase_admin

router = APIRouter()
stripe.api_key = settings.stripe_secret_key


def _ts_to_dt(ts: int | None) -> datetime | None:
    return datetime.fromtimestamp(ts, tz=timezone.utc) if ts else None


def _upsert_subscription(*, customer_id: str, sub: stripe.Subscription) -> None:
    """Reconcile our DB row with the latest Stripe state."""
    sb = supabase_admin()

    # Find user via stripe_customer_id (set during checkout) -----------------
    res = (
        sb.table("subscriptions")
        .select("id, user_id")
        .eq("stripe_customer_id", customer_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        logger.warning("Received Stripe event for unknown customer {}", customer_id)
        return

    user_id = res.data[0]["user_id"]
    is_pro_active = sub.status in {"active", "trialing"}

    payload = {
        "plan_type": "pro" if is_pro_active else "free",
        "status": sub.status,
        "stripe_subscription_id": sub.id,
        "billing_cycle_end": _ts_to_dt(sub.current_period_end).isoformat()
            if sub.current_period_end else None,
    }

    # Credit reset rule: top up to PRO_PLAN_CREDITS on creation or renewal ---
    if is_pro_active:
        payload["video_credits_left"] = settings.pro_plan_credits

    sb.table("subscriptions").update(payload).eq("user_id", user_id).execute()
    logger.info("Subscription synced for user {} (status={})", user_id, sub.status)


@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(default="", alias="Stripe-Signature"),
) -> dict:
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise HTTPException(400, f"Invalid Stripe signature: {exc}") from exc

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info("Stripe event received: {}", event_type)

    if event_type == "checkout.session.completed":
        # Persist stripe_customer_id <-> user mapping the first time a user pays.
        user_id = (data.get("metadata") or {}).get("user_id")
        customer_id = data.get("customer")
        if user_id and customer_id:
            supabase_admin().table("subscriptions").update(
                {"stripe_customer_id": customer_id}
            ).eq("user_id", user_id).execute()

    elif event_type in {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    }:
        customer_id = data.get("customer")
        if customer_id:
            sub = stripe.Subscription.retrieve(data["id"])
            _upsert_subscription(customer_id=customer_id, sub=sub)

    elif event_type == "invoice.payment_succeeded":
        # Renewal — re-top credits.
        customer_id = data.get("customer")
        sub_id = data.get("subscription")
        if customer_id and sub_id:
            sub = stripe.Subscription.retrieve(sub_id)
            _upsert_subscription(customer_id=customer_id, sub=sub)

    return {"received": True}
