"""Reusable FastAPI dependencies (auth + subscription gating)."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_supabase_jwt
from app.schemas.auth import CurrentUser
from app.services import subscriptions as sub_service

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    claims = decode_supabase_jwt(creds.credentials)
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim.",
        )
    return CurrentUser(
        id=user_id,
        email=claims.get("email"),
        full_name=(claims.get("user_metadata") or {}).get("full_name"),
    )


async def require_credit(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Reject the request if the user has no remaining video credits."""
    sub = sub_service.get_subscription(user.id)
    if int(sub.get("video_credits_left", 0)) <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No video credits left. Upgrade your plan or wait for the next billing cycle.",
        )
    return user
