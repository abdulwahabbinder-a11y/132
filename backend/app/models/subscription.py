from datetime import datetime

from pydantic import BaseModel, Field


class UserModel(BaseModel):
    id: str
    email: str
    stripe_customer_id: str | None = None
    preferred_script_language: str = "en"
    video_credits_left: int = 0
    created_at: datetime | None = None


class SubscriptionModel(BaseModel):
    id: str | None = None
    user_id: str
    plan_type: str = Field(description="free or pro")
    stripe_customer_id: str
    video_credits_left: int = 30
    billing_cycle_end: datetime | None = None
