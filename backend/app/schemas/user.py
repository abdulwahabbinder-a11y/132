"""User & subscription pydantic schemas."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr

PlanType = Literal["free", "pro"]


class AuthedUser(BaseModel):
    id: str
    email: EmailStr | str
    plan_type: PlanType = "free"
    video_credits_left: int = 0
    stripe_customer_id: Optional[str] = None
    billing_cycle_end: Optional[datetime] = None


class SubscriptionOut(BaseModel):
    plan_type: PlanType
    status: str
    video_credits_left: int
    billing_cycle_end: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None


class CheckoutSessionIn(BaseModel):
    success_url: str
    cancel_url: str


class CheckoutSessionOut(BaseModel):
    checkout_url: str
