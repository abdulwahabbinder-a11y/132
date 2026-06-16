from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings
from app.db.supabase import SupabaseGateway
from app.schemas import AuthenticatedUser


def get_supabase(settings: Settings = Depends(get_settings)) -> SupabaseGateway:
    return SupabaseGateway(settings)


async def require_user(
    authorization: str | None = Header(default=None),
    supabase: SupabaseGateway = Depends(get_supabase),
) -> AuthenticatedUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    try:
        user = await supabase.get_auth_user(token)
        await supabase.ensure_user_profile(user)
        return user
    except Exception as exc:  # noqa: BLE001 - converted to a stable auth error boundary.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase session") from exc
