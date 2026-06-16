"""Stripe checkout + billing portal endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.billing import (
    BillingPortalResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
)
from app.services.billing import stripe_service

router = APIRouter()


@router.post("/billing/checkout", response_model=CheckoutSessionResponse)
def create_checkout(
    _: CheckoutSessionRequest,
    user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    """Create a Stripe Checkout session for the Pro plan."""
    try:
        url = stripe_service.create_checkout_session(user)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    return CheckoutSessionResponse(checkout_url=url)


@router.post("/billing/portal", response_model=BillingPortalResponse)
def create_portal(user: User = Depends(get_current_user)) -> BillingPortalResponse:
    """Create a Stripe billing portal session for managing the subscription."""
    try:
        url = stripe_service.create_billing_portal(user)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return BillingPortalResponse(portal_url=url)
