from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db_session
from app.dependencies import get_app_settings
from app.models import Subscription, User
from app.schemas import StripeWebhookResponse


router = APIRouter(prefix="/api/webhooks", tags=["stripe"])


@router.post("/stripe", response_model=StripeWebhookResponse)
async def handle_stripe_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_app_settings)],
    stripe_signature: Annotated[str | None, Header(alias="Stripe-Signature")] = None,
) -> StripeWebhookResponse:
    if not settings.stripe_secret_key or not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe is not configured.",
        )

    stripe.api_key = settings.stripe_secret_key
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe webhook.") from exc

    if event["type"] != "customer.subscription.created":
        return StripeWebhookResponse(received=True)

    subscription_data: dict[str, Any] = event["data"]["object"]
    customer_id = subscription_data.get("customer")
    metadata = subscription_data.get("metadata", {}) or {}
    supabase_user_id = metadata.get("supabase_user_id")

    user = None
    if supabase_user_id:
        user = await db.get(User, supabase_user_id)

    if user is None and customer_id:
        result = await db.execute(select(User).where(User.stripe_customer_id == customer_id))
        user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User for subscription not found.")

    cycle_end = subscription_data.get("current_period_end")
    billing_cycle_end = datetime.fromtimestamp(cycle_end, UTC) if cycle_end else None

    user.plan_type = "pro"
    user.stripe_customer_id = customer_id
    user.video_credits_left = settings.pro_video_credits
    user.billing_cycle_end = billing_cycle_end

    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == subscription_data.get("id"))
    )
    subscription = result.scalar_one_or_none()
    if subscription is None:
        subscription = Subscription(
            user_id=user.id,
            stripe_subscription_id=subscription_data.get("id"),
        )
        db.add(subscription)

    subscription.plan_type = "pro"
    subscription.status = subscription_data.get("status", "active")
    subscription.stripe_customer_id = customer_id
    subscription.video_credits_left = settings.pro_video_credits
    subscription.billing_cycle_end = billing_cycle_end

    await db.commit()
    return StripeWebhookResponse(received=True, subscription_id=subscription.stripe_subscription_id)
