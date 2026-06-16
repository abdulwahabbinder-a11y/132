"""``subscriptions`` table representation."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class PlanType(str, Enum):
    FREE = "free"
    PRO = "pro"


class Subscription(BaseModel):
    id: str | None = None
    user_id: str
    plan_type: PlanType = PlanType.FREE
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    video_credits_left: int = 0
    billing_cycle_end: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @property
    def has_credits(self) -> bool:
        return self.video_credits_left > 0
