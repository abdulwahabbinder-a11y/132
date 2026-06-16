"""Subscription + checkout routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.auth import CurrentUser
from app.core.config import settings
from app.db.session import DbSession
from app.models.subscription import PlanType, Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionPublic
from app.services.stripe import create_checkout_session, create_customer

router = APIRouter()


class CheckoutRequest(BaseModel):
    plan: PlanType = PlanType.pro


class CheckoutResponse(BaseModel):
    url: str


@router.get("/me", response_model=SubscriptionPublic)
async def my_subscription(user: CurrentUser, db: DbSession) -> SubscriptionPublic:
    sub = (
        await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    ).scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=user.id)
        db.add(sub)
        await db.flush()
    return SubscriptionPublic.model_validate(sub)


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(
    payload: CheckoutRequest,
    user: CurrentUser,
    db: DbSession,
) -> CheckoutResponse:
    if payload.plan != PlanType.pro:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Only the Pro plan requires Stripe checkout.",
        )

    db_user = (await db.execute(select(User).where(User.id == user.id))).scalar_one_or_none()
    if not db_user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")

    sub = (
        await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    ).scalar_one_or_none()
    if not sub:
        sub = Subscription(user_id=user.id)
        db.add(sub)
        await db.flush()

    if not sub.stripe_customer_id:
        sub.stripe_customer_id = create_customer(
            email=db_user.email,
            user_id=str(db_user.id),
        )

    url = create_checkout_session(
        customer_id=sub.stripe_customer_id,
        price_id=settings.stripe_price_pro,
        success_url=f"{settings.frontend_base_url}/dashboard?checkout=success",
        cancel_url=f"{settings.frontend_base_url}/pricing?checkout=cancelled",
    )
    return CheckoutResponse(url=url)
