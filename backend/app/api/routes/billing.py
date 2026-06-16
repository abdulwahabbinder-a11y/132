"""Billing routes: pricing catalogue + Stripe Checkout session creation."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.schemas.auth import CurrentUser
from app.schemas.subscription import CheckoutSessionRequest, CheckoutSessionResponse
from app.services import stripe_service

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/plans")
async def plans() -> dict:
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free Plan",
                "price_usd": 0,
                "interval": "month",
                "credits": settings.FREE_PLAN_CREDITS,
                "features": [
                    f"{settings.FREE_PLAN_CREDITS} documentary credits",
                    "720p exports",
                    "Watermarked output",
                    "Community support",
                ],
            },
            {
                "id": "pro",
                "name": "Pro Plan",
                "price_usd": 29,
                "interval": "month",
                "credits": settings.PRO_PLAN_MONTHLY_CREDITS,
                "stripe_price_id": settings.STRIPE_PRICE_ID_PRO,
                "features": [
                    f"{settings.PRO_PLAN_MONTHLY_CREDITS} documentary credits / month",
                    "21:9 cinematic 4K exports",
                    "No watermark",
                    "Neural character cinematics (DeepVideo-V1)",
                    "Priority rendering queue",
                ],
            },
        ]
    }


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout(
    payload: CheckoutSessionRequest,
    user: CurrentUser = Depends(get_current_user),
) -> CheckoutSessionResponse:
    try:
        url = stripe_service.create_checkout_session(
            user_id=user.id,
            email=user.email,
            success_url=payload.success_url,
            cancel_url=payload.cancel_url,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    return CheckoutSessionResponse(checkout_url=url)
