import stripe
import structlog
from fastapi import APIRouter, Request, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.subscription import Subscription, PlanType, SubscriptionStatus
from app.models.user import User

router = APIRouter()
settings = get_settings()
logger = structlog.get_logger()

stripe.api_key = settings.STRIPE_SECRET_KEY

HANDLED_EVENTS = {
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
}


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    """
    Handle Stripe webhook events.
    Validates the webhook signature before processing.
    """
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        logger.warning("stripe_webhook.invalid_signature")
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    event_type: str = event["type"]
    logger.info("stripe_webhook.received", event_type=event_type, event_id=event["id"])

    if event_type not in HANDLED_EVENTS:
        return {"status": "ignored"}

    async with AsyncSessionLocal() as db:
        try:
            await _handle_event(event, db)
            await db.commit()
        except Exception as exc:
            await db.rollback()
            logger.error("stripe_webhook.error", event_type=event_type, error=str(exc))
            raise HTTPException(status_code=500, detail="Webhook processing failed")

    return {"status": "ok"}


async def _handle_event(event: dict, db: AsyncSession):
    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "customer.subscription.created":
        await _on_subscription_created(data_object, db)

    elif event_type == "customer.subscription.updated":
        await _on_subscription_updated(data_object, db)

    elif event_type == "customer.subscription.deleted":
        await _on_subscription_deleted(data_object, db)

    elif event_type == "invoice.payment_succeeded":
        await _on_payment_succeeded(data_object, db)

    elif event_type == "invoice.payment_failed":
        await _on_payment_failed(data_object, db)


async def _get_subscription_by_stripe_customer(
    stripe_customer_id: str, db: AsyncSession
) -> Subscription | None:
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_customer_id == stripe_customer_id)
    )
    return result.scalar_one_or_none()


async def _on_subscription_created(stripe_sub: dict, db: AsyncSession):
    """Reset credits to 30 when a new Pro subscription is created."""
    stripe_customer_id = stripe_sub["customer"]
    sub = await _get_subscription_by_stripe_customer(stripe_customer_id, db)

    if sub:
        sub.stripe_subscription_id = stripe_sub["id"]
        sub.stripe_price_id = stripe_sub["items"]["data"][0]["price"]["id"] if stripe_sub["items"]["data"] else None
        sub.plan_type = PlanType.PRO
        sub.status = SubscriptionStatus.ACTIVE
        sub.video_credits_left = settings.STRIPE_PRO_PLAN_CREDITS  # Reset to 30
        logger.info(
            "stripe_webhook.subscription_created",
            customer=stripe_customer_id,
            credits=sub.video_credits_left,
        )
    else:
        logger.warning("stripe_webhook.subscription_created.user_not_found", customer=stripe_customer_id)


async def _on_subscription_updated(stripe_sub: dict, db: AsyncSession):
    stripe_customer_id = stripe_sub["customer"]
    sub = await _get_subscription_by_stripe_customer(stripe_customer_id, db)

    if sub:
        stripe_status = stripe_sub.get("status", "active")
        status_map = {
            "active": SubscriptionStatus.ACTIVE,
            "canceled": SubscriptionStatus.CANCELED,
            "past_due": SubscriptionStatus.PAST_DUE,
            "trialing": SubscriptionStatus.TRIALING,
            "incomplete": SubscriptionStatus.INCOMPLETE,
        }
        sub.status = status_map.get(stripe_status, SubscriptionStatus.ACTIVE)
        if sub.status == SubscriptionStatus.CANCELED:
            sub.plan_type = PlanType.FREE
            sub.video_credits_left = 0

        logger.info("stripe_webhook.subscription_updated", customer=stripe_customer_id, status=sub.status)


async def _on_subscription_deleted(stripe_sub: dict, db: AsyncSession):
    stripe_customer_id = stripe_sub["customer"]
    sub = await _get_subscription_by_stripe_customer(stripe_customer_id, db)

    if sub:
        sub.plan_type = PlanType.FREE
        sub.status = SubscriptionStatus.CANCELED
        sub.video_credits_left = 0
        sub.stripe_subscription_id = None
        logger.info("stripe_webhook.subscription_deleted", customer=stripe_customer_id)


async def _on_payment_succeeded(invoice: dict, db: AsyncSession):
    """On successful renewal, reset credits to 30."""
    stripe_customer_id = invoice.get("customer")
    subscription_id = invoice.get("subscription")
    if not subscription_id:
        return

    sub = await _get_subscription_by_stripe_customer(stripe_customer_id, db)
    if sub and sub.plan_type == PlanType.PRO:
        sub.video_credits_left = settings.STRIPE_PRO_PLAN_CREDITS
        logger.info(
            "stripe_webhook.payment_succeeded_credits_reset",
            customer=stripe_customer_id,
            credits=sub.video_credits_left,
        )


async def _on_payment_failed(invoice: dict, db: AsyncSession):
    stripe_customer_id = invoice.get("customer")
    sub = await _get_subscription_by_stripe_customer(stripe_customer_id, db)
    if sub:
        sub.status = SubscriptionStatus.PAST_DUE
        logger.warning("stripe_webhook.payment_failed", customer=stripe_customer_id)
