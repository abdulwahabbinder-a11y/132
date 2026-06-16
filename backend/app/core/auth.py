"""Supabase JWT authentication dependency for FastAPI routes."""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Lightweight container with the data we need from the JWT."""

    def __init__(self, *, user_id: str, email: str | None, role: str | None):
        self.id = user_id
        self.email = email
        self.role = role

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"AuthenticatedUser(id={self.id!r}, email={self.email!r})"


def _decode_supabase_jwt(token: str) -> dict:
    secret = settings.supabase_jwt_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase JWT secret is not configured.",
        )
    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid auth token: {exc}",
        ) from exc


async def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    payload = _decode_supabase_jwt(credentials.credentials)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Auth token missing 'sub' claim.",
        )
    return AuthenticatedUser(
        user_id=sub,
        email=payload.get("email"),
        role=payload.get("role"),
    )


CurrentUser = Annotated[AuthenticatedUser, Depends(current_user)]
