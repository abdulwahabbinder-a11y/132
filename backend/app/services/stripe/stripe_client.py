"""Thin Stripe SDK wrapper."""

from __future__ import annotations

from functools import lru_cache

import stripe

from app.core.config import settings


@lru_cache(maxsize=1)
def get_stripe() -> "stripe":  # type: ignore[valid-type]
    if not settings.stripe_secret_key:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured.")
    stripe.api_key = settings.stripe_secret_key
    return stripe


def create_customer(*, email: str, user_id: str) -> str:
    sdk = get_stripe()
    customer = sdk.Customer.create(email=email, metadata={"user_id": user_id})
    return customer["id"]


def create_checkout_session(
    *,
    customer_id: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
) -> str:
    sdk = get_stripe()
    session = sdk.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        allow_promotion_codes=True,
        billing_address_collection="auto",
    )
    return session["url"]


def parse_webhook_event(*, payload: bytes, sig_header: str) -> dict:
    sdk = get_stripe()
    return sdk.Webhook.construct_event(
        payload=payload,
        sig_header=sig_header,
        secret=settings.stripe_webhook_secret,
    )
