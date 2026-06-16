"""Stripe webhook handler."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.core.logging import logger
from app.services.billing import stripe_service

router = APIRouter()


@router.post("/webhooks/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(default="", alias="Stripe-Signature"),
) -> dict:
    """Receive and dispatch Stripe webhook events.

    Handles:
      * ``customer.subscription.created``  -> upgrade to Pro, reset credits to 30
      * ``customer.subscription.deleted``  -> downgrade to Free
    """
    payload = await request.body()
    try:
        event = stripe_service.construct_event(payload, stripe_signature)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except Exception as exc:  # invalid signature / payload
        logger.warning("Rejected Stripe webhook: {}", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature."
        ) from exc

    event_type = event["type"]
    logger.info("Stripe webhook received: {}", event_type)

    if event_type == "customer.subscription.created":
        stripe_service.handle_subscription_created(event)
    elif event_type == "customer.subscription.deleted":
        stripe_service.handle_subscription_deleted(event)
    else:
        logger.debug("Unhandled Stripe event: {}", event_type)

    return {"received": True}
