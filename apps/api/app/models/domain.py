from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str


@dataclass(frozen=True)
class SubscriptionRecord:
    id: str
    user_id: str
    plan_type: str
    video_credits_left: int
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    billing_cycle_end: datetime | None = None
