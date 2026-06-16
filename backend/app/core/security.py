"""JWT verification for Supabase-issued access tokens."""

from __future__ import annotations

from typing import Any, Dict

import jwt
from fastapi import HTTPException, status

from app.core.config import settings


def decode_supabase_jwt(token: str) -> Dict[str, Any]:
    """Decode and verify a Supabase access token.

    Supabase signs access tokens (HS256) with the project's JWT secret. The
    ``sub`` claim is the user's UUID and ``email`` carries the address.
    """
    if not settings.SUPABASE_JWT_SECRET:
        # In local dev without a configured secret, decode without verification
        # so the API remains usable for smoke testing.
        try:
            return jwt.decode(token, options={"verify_signature": False})
        except jwt.PyJWTError as exc:  # pragma: no cover
            raise _credentials_error() from exc

    try:
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired.",
        ) from exc
    except jwt.PyJWTError as exc:
        raise _credentials_error() from exc


def _credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
