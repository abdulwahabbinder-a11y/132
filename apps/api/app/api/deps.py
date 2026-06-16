from collections.abc import AsyncIterator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.models.subscription import Subscription
from app.models.user import User
from app.services.auth import SupabaseAuthService, get_or_create_local_user


async def db_session_dep() -> AsyncIterator[AsyncSession]:
    async for session in get_db_session():
        yield session


async def get_current_user(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(db_session_dep),
) -> tuple[User, Subscription]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", maxsplit=1)[1]
    auth_service = SupabaseAuthService()
    auth_user = await auth_service.verify_access_token(token)
    return await get_or_create_local_user(session, auth_user)
