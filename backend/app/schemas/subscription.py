from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SubscriptionOut(BaseModel):
    plan_type: str
    video_credits_left: int
    billing_cycle_end: Optional[datetime] = None
    status: str
    stripe_customer_id: Optional[str] = None


class CheckoutSessionRequest(BaseModel):
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
