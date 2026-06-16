from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter(tags=["auth"])


@router.get("/me")
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(desc(Subscription.created_at))
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    return {
        "id": str(user.id),
        "email": user.email,
        "preferred_language": user.preferred_language,
        "subscription": {
            "plan_type": sub.plan_type if sub else "free",
            "video_credits_left": sub.video_credits_left if sub else 0,
            "billing_cycle_end": sub.billing_cycle_end if sub else None,
        },
    }
