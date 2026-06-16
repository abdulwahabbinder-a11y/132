"""Authenticated account / profile endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_account
from app.schemas.user import AccountResponse
from app.services.account import AccountService

router = APIRouter()


@router.get("/me", response_model=AccountResponse)
def get_me(account: AccountService = Depends(get_account)) -> AccountResponse:
    """Return the current user's profile + subscription summary."""
    sub = account.get_subscription()
    return AccountResponse(
        id=account.user.id,
        email=account.user.email,
        plan_type=sub.plan_type,
        video_credits_left=sub.video_credits_left,
        billing_cycle_end=sub.billing_cycle_end,
    )
