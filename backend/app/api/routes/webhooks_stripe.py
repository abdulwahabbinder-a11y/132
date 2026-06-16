"""POST /api/webhooks/stripe — handles Stripe subscription lifecycle events."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlalchemy import select

from app.core.config import settings
from app.core.logging import logger
from app.db.session import DbSession
from app.models.subscription import PlanType, Subscription
from app.services.stripe import parse_webhook_event

router = APIRouter()


async def _get_subscription_by_customer(db, customer_id: str) -> Subscription | None:
    return (
        await db.execute(
            select(Subscription).where(Subscription.stripe_customer_id == customer_id)
        )
    ).scalar_one_or_none()


@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: DbSession,
    stripe_signature: str = Header(default="", alias="stripe-signature"),
) -> dict[str, str]:
    payload = await request.body()
    try:
        event = parse_webhook_event(payload=payload, sig_header=stripe_signature)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Stripe webhook signature failure: {}", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    event_type = event["type"]
    obj = event["data"]["object"]
    logger.info("Stripe webhook received: {}", event_type)

    if event_type == "customer.subscription.created":
        customer_id = obj.get("customer")
        sub = await _get_subscription_by_customer(db, customer_id)
        if sub:
            sub.plan_type = PlanType.pro
            sub.stripe_subscription_id = obj["id"]
            sub.video_credits_left = settings.pro_plan_credits  # reset to 30
            cur_period_end = obj.get("current_period_end")
            if cur_period_end:
                sub.billing_cycle_end = datetime.fromtimestamp(cur_period_end, tz=timezone.utc)
            logger.info("Reset credits=30 for customer={}", customer_id)

    elif event_type == "customer.subscription.updated":
        customer_id = obj.get("customer")
        sub = await _get_subscription_by_customer(db, customer_id)
        if sub:
            cancel_at = obj.get("cancel_at_period_end")
            if cancel_at:
                sub.plan_type = PlanType.free
            cur_period_end = obj.get("current_period_end")
            if cur_period_end:
                sub.billing_cycle_end = datetime.fromtimestamp(cur_period_end, tz=timezone.utc)

    elif event_type == "customer.subscription.deleted":
        customer_id = obj.get("customer")
        sub = await _get_subscription_by_customer(db, customer_id)
        if sub:
            sub.plan_type = PlanType.free
            sub.video_credits_left = settings.free_plan_credits

    elif event_type == "invoice.payment_succeeded":
        customer_id = obj.get("customer")
        sub = await _get_subscription_by_customer(db, customer_id)
        if sub and sub.plan_type == PlanType.pro:
            sub.video_credits_left = settings.pro_plan_credits

    return {"status": "ok", "event": event_type}
