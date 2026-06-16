"""Stripe billing helpers: checkout sessions + webhook verification."""

from __future__ import annotations

from typing import Any, Dict

import stripe

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(
    user_id: str, email: str | None, success_url: str, cancel_url: str
) -> str:
    """Create a Stripe Checkout session for the Pro subscription."""
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PRICE_ID_PRO:
        raise RuntimeError("Stripe is not configured.")

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.STRIPE_PRICE_ID_PRO, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=email,
        client_reference_id=user_id,
        metadata={"user_id": user_id},
        subscription_data={"metadata": {"user_id": user_id}},
    )
    return session.url


def verify_webhook(payload: bytes, signature: str) -> Dict[str, Any]:
    """Verify a Stripe webhook signature and return the parsed event."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        # Dev fallback: parse without verification.
        import json

        log.warning("stripe.webhook.unverified")
        return json.loads(payload)

    return stripe.Webhook.construct_event(
        payload, signature, settings.STRIPE_WEBHOOK_SECRET
    )
