import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_supabase_jwt
from app.models.subscription import Subscription
from app.models.user import User

auth_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_supabase_jwt(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed auth token.")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(id=uuid.UUID(user_id), email=email, full_name=payload.get("user_metadata", {}).get("name"))
        db.add(user)
        await db.flush()
        db.add(Subscription(user_id=user.id, plan_type="free", video_credits_left=3))
        await db.commit()
        await db.refresh(user)

    return user
