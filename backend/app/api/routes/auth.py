"""Current-user & subscription introspection routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.subscription import SubscriptionOut
from app.services import subscriptions as sub_service

router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/me", response_model=CurrentUser)
async def me(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return user


@router.get("/me/subscription", response_model=SubscriptionOut)
async def my_subscription(user: CurrentUser = Depends(get_current_user)) -> SubscriptionOut:
    sub = sub_service.get_subscription(user.id)
    return SubscriptionOut(
        plan_type=sub.get("plan_type", "free"),
        video_credits_left=int(sub.get("video_credits_left", 0)),
        billing_cycle_end=sub.get("billing_cycle_end"),
        status=sub.get("status", "active"),
        stripe_customer_id=sub.get("stripe_customer_id"),
    )
