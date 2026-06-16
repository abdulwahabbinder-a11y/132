"""Subscription read + Stripe checkout session creation."""

import stripe
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.core.auth import CurrentUser
from app.database import supabase_admin
from app.schemas.user import (
    CheckoutSessionIn,
    CheckoutSessionOut,
    SubscriptionOut,
)

router = APIRouter()
stripe.api_key = settings.stripe_secret_key


@router.get("/subscription", response_model=SubscriptionOut)
async def get_subscription(user: CurrentUser) -> SubscriptionOut:
    res = (
        supabase_admin()
        .table("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Subscription not found.")
    return SubscriptionOut(**res.data)


@router.post("/billing/checkout", response_model=CheckoutSessionOut)
async def create_checkout(body: CheckoutSessionIn, user: CurrentUser) -> CheckoutSessionOut:
    """Create a Stripe Checkout session for the Pro plan."""
    if not settings.stripe_pro_price_id:
        raise HTTPException(500, "Pro plan price ID is not configured.")

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer_email=user.email,
        line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        metadata={"user_id": user.id},
        allow_promotion_codes=True,
    )
    return CheckoutSessionOut(checkout_url=session.url)


@router.post("/billing/portal")
async def create_portal(user: CurrentUser) -> dict:
    if not user.stripe_customer_id:
        raise HTTPException(400, "No Stripe customer associated with this account.")
    portal = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_base_url}/dashboard",
    )
    return {"portal_url": portal.url}
