from datetime import datetime

from pydantic import BaseModel


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str | None = None


class Subscription(BaseModel):
    id: str
    user_id: str
    plan_type: str
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    video_credits_left: int
    billing_cycle_end: datetime | None = None


class BillingPortalLink(BaseModel):
    url: str
