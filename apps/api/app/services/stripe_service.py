import uuid
from datetime import UTC, datetime

import stripe
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.subscription import PlanType, Subscription

settings = get_settings()
stripe.api_key = settings.stripe_secret_key.get_secret_value()


class StripeBillingService:
    def construct_event(self, payload: bytes, signature: str) -> stripe.Event:
        try:
            return stripe.Webhook.construct_event(
                payload=payload,
                sig_header=signature,
                secret=settings.stripe_webhook_secret.get_secret_value(),
            )
        except stripe.error.SignatureVerificationError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Stripe signature"
            ) from exc

    async def sync_subscription_created(
        self, session: AsyncSession, subscription_payload: dict
    ) -> Subscription:
        customer_id = subscription_payload["customer"]
        metadata = subscription_payload.get("metadata", {})
        billing_cycle_end = datetime.fromtimestamp(
            subscription_payload["current_period_end"], tz=UTC
        )

        result = await session.execute(
            select(Subscription).where(Subscription.stripe_customer_id == customer_id)
        )
        subscription = result.scalar_one_or_none()

        if subscription is None:
            user_id = metadata.get("supabase_user_id")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No subscription record matched this Stripe customer",
                )
            user_subscription_result = await session.execute(
                select(Subscription).where(Subscription.user_id == uuid.UUID(user_id))
            )
            subscription = user_subscription_result.scalar_one_or_none()

        if subscription is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription record not found for Stripe webhook",
            )

        subscription.plan_type = PlanType.pro
        subscription.stripe_customer_id = customer_id
        subscription.video_credits_left = settings.pro_plan_video_credits
        subscription.billing_cycle_end = billing_cycle_end
        await session.flush()
        return subscription
