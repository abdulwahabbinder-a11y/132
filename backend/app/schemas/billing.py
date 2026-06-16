"""Schemas for billing / checkout flows."""

from __future__ import annotations

from pydantic import BaseModel


class CheckoutSessionRequest(BaseModel):
    # Currently only the Pro plan is a paid tier; kept explicit for future plans.
    plan: str = "pro"


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class BillingPortalResponse(BaseModel):
    portal_url: str
