import uuid
from dataclasses import dataclass

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.subscription import PlanType, Subscription
from app.models.user import User

settings = get_settings()


@dataclass(slots=True)
class AuthenticatedUser:
    id: uuid.UUID
    email: str
    preferred_language: str


class SupabaseAuthService:
    async def verify_access_token(self, token: str) -> AuthenticatedUser:
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.supabase_service_role_key.get_secret_value(),
        }
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(f"{settings.supabase_url}/auth/v1/user", headers=headers)

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

        payload = response.json()
        return AuthenticatedUser(
            id=uuid.UUID(payload["id"]),
            email=payload["email"],
            preferred_language=payload.get("user_metadata", {}).get("preferred_language", "english"),
        )


async def get_or_create_local_user(
    session: AsyncSession, auth_user: AuthenticatedUser
) -> tuple[User, Subscription]:
    result = await session.execute(select(User).where(User.id == auth_user.id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=auth_user.id,
            email=auth_user.email,
            preferred_language=auth_user.preferred_language,
        )
        session.add(user)

    subscription_result = await session.execute(
        select(Subscription).where(Subscription.user_id == auth_user.id)
    )
    subscription = subscription_result.scalar_one_or_none()

    if subscription is None:
        subscription = Subscription(
            user_id=auth_user.id,
            plan_type=PlanType.free,
            video_credits_left=settings.default_free_video_credits,
        )
        session.add(subscription)

    await session.flush()
    return user, subscription
