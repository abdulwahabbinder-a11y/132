from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class SubscriptionPlan(str, Enum):
    FREE = "free"
    PRO = "pro"


class Subscription(BaseModel):
    id: UUID | None = None
    user_id: UUID
    plan_type: SubscriptionPlan = SubscriptionPlan.FREE
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    video_credits_left: int = 5
    billing_cycle_end: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
