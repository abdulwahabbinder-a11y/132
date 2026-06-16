"""Shared FastAPI dependencies (auth, current user, subscription)."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import AuthError, decode_supabase_jwt
from app.models.user import User
from app.services.account import AccountService, get_account_service

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> User:
    """Resolve the authenticated user from a Supabase bearer token."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = decode_supabase_jwt(credentials.credentials)
    except AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return User(id=claims["sub"], email=claims.get("email", "unknown@docuforge.ai"))


def get_account(
    user: User = Depends(get_current_user),
    service: AccountService = Depends(get_account_service),
) -> AccountService:
    """Return an account service bound to the current user."""
    service.bind(user)
    return service
