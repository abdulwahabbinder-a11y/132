from datetime import datetime, timezone

import stripe
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.subscription import Subscription

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


class StripeService:
    async def handle_subscription_created(self, event_payload: dict, db: AsyncSession) -> None:
        obj = event_payload["data"]["object"]
        stripe_customer_id = obj.get("customer")
        current_period_end = obj.get("current_period_end")

        if not stripe_customer_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing customer id")

        result = await db.execute(
            select(Subscription).where(Subscription.stripe_customer_id == stripe_customer_id)
        )
        sub = result.scalar_one_or_none()
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription record not mapped to Stripe customer.",
            )

        sub.plan_type = "pro"
        sub.video_credits_left = 30
        sub.billing_cycle_end = (
            datetime.fromtimestamp(current_period_end, tz=timezone.utc) if current_period_end else None
        )
        await db.commit()
