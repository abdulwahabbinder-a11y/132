"""Public subscription representation."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.subscription import PlanType


class SubscriptionPublic(BaseModel):
    plan_type: PlanType
    video_credits_left: int
    billing_cycle_end: datetime | None
    stripe_customer_id: str | None

    model_config = {"from_attributes": True}
