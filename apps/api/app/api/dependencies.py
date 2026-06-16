from functools import lru_cache

from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings
from app.models.domain import AuthenticatedUser
from app.services.supabase_service import SupabaseService


@lru_cache
def get_supabase_service() -> SupabaseService:
    return SupabaseService(get_settings())


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is required",
        )
    return authorization.split(" ", 1)[1].strip()


def get_current_user(
    token: str = Depends(get_bearer_token),
    supabase: SupabaseService = Depends(get_supabase_service),
) -> AuthenticatedUser:
    user = supabase.get_user_from_token(token)
    supabase.ensure_profile(user)
    return user


def get_app_settings() -> Settings:
    return get_settings()
