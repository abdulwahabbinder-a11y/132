from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.subscription import SubscriptionPlan


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str | None = None


class SubscriptionResponse(BaseModel):
    plan_type: SubscriptionPlan
    video_credits_left: int
    billing_cycle_end: datetime | None = None
    stripe_customer_id: str | None = None
