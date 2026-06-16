"""Supabase JWT verification + FastAPI dependency for `current_user`."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database import supabase_admin
from app.schemas.user import AuthedUser

_bearer = HTTPBearer(auto_error=False)


def _decode_supabase_jwt(token: str) -> dict:
    """Verify a Supabase-issued JWT using the project's HS256 secret."""
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid auth token: {exc}",
        ) from exc


async def current_user(
    request: Request,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> AuthedUser:
    """Resolve the calling user from the bearer token + load profile + subscription."""
    if creds is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    payload = _decode_supabase_jwt(creds.credentials)
    user_id: str | None = payload.get("sub")
    email: str | None = payload.get("email")
    if not user_id:
        raise HTTPException(401, "Token missing subject.")

    sb = supabase_admin()
    sub = (
        sb.table("subscriptions")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    sub_row = sub.data[0] if sub.data else None

    return AuthedUser(
        id=user_id,
        email=email or "",
        plan_type=(sub_row or {}).get("plan_type", "free"),
        video_credits_left=(sub_row or {}).get("video_credits_left", 0),
        stripe_customer_id=(sub_row or {}).get("stripe_customer_id"),
        billing_cycle_end=(sub_row or {}).get("billing_cycle_end"),
    )


CurrentUser = Annotated[AuthedUser, Depends(current_user)]
