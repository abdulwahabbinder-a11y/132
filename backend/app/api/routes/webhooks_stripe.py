"""POST /api/webhooks/stripe — Stripe subscription lifecycle handler."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.core.config import settings
from app.core.logging import get_logger
from app.services import stripe_service
from app.services import subscriptions as sub_service

router = APIRouter(prefix="/api", tags=["webhooks"])
log = get_logger(__name__)


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
):
    payload = await request.body()
    try:
        event = stripe_service.verify_webhook(payload, stripe_signature or "")
    except Exception as exc:  # noqa: BLE001
        log.warning("stripe.webhook.invalid", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature."
        ) from exc

    event_type = event.get("type")
    data_object = event.get("data", {}).get("object", {})
    log.info("stripe.webhook.received", type=event_type)

    if event_type == "customer.subscription.created":
        _handle_subscription_created(data_object)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(data_object)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data_object)
    elif event_type == "invoice.paid":
        # Recurring renewal: top credits back up for the new cycle.
        _handle_subscription_created(data_object)

    return {"received": True}


def _handle_subscription_created(obj: dict) -> None:
    customer_id = obj.get("customer")
    user_id = (obj.get("metadata") or {}).get("user_id")

    if user_id and customer_id:
        sub_service.attach_stripe_customer(user_id, customer_id)

    if customer_id:
        affected = sub_service.reset_credits_for_customer(
            customer_id, settings.PRO_PLAN_MONTHLY_CREDITS
        )
        log.info("stripe.credits_reset", customer=customer_id, user=affected, credits=30)


def _handle_subscription_updated(obj: dict) -> None:
    customer_id = obj.get("customer")
    if customer_id and obj.get("status") == "active":
        sub_service.reset_credits_for_customer(
            customer_id, settings.PRO_PLAN_MONTHLY_CREDITS
        )


def _handle_subscription_deleted(obj: dict) -> None:
    customer_id = obj.get("customer")
    if not customer_id:
        return
    sub_service.downgrade_to_free(customer_id)
    log.info("stripe.subscription_cancelled", customer=customer_id)
