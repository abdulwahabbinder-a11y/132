from datetime import datetime

from pydantic import BaseModel


class SubscriptionSnapshot(BaseModel):
    plan_type: str
    stripe_customer_id: str | None = None
    video_credits_left: int
    billing_cycle_end: datetime | None = None
