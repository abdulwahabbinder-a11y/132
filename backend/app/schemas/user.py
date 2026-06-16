"""Schemas for the authenticated user / account endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.subscription import PlanType


class AccountResponse(BaseModel):
    id: str
    email: str
    full_name: str | None = None
    plan_type: PlanType
    video_credits_left: int
    billing_cycle_end: datetime | None = None
