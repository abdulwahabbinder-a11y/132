"""Authentication helpers.

Supabase issues JWTs signed with the project's JWT secret (HS256). We verify the
bearer token locally to authenticate API requests without an extra round-trip.
"""

from __future__ import annotations

import jwt

from app.config import settings
from app.core.logging import logger


class AuthError(Exception):
    """Raised when a token cannot be verified."""


def decode_supabase_jwt(token: str) -> dict:
    """Decode and validate a Supabase access token.

    Returns the token claims (``sub`` is the user id, ``email`` the user email).
    Raises :class:`AuthError` on any verification failure.
    """
    if not settings.supabase_jwt_secret:
        raise AuthError("Supabase JWT secret is not configured on the server.")

    try:
        claims = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except jwt.ExpiredSignatureError as exc:  # pragma: no cover - trivial
        raise AuthError("Access token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        logger.warning("Rejected invalid JWT: {}", exc)
        raise AuthError("Invalid access token.") from exc

    if not claims.get("sub"):
        raise AuthError("Token is missing a subject claim.")
    return claims


__all__ = ["AuthError", "decode_supabase_jwt"]
