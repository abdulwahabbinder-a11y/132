import logging
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.dependencies import get_current_user_id
from app.database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])


class CheckoutRequest(BaseModel):
    plan: str = "pro"


class CheckoutResponse(BaseModel):
    checkout_url: str


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    body: CheckoutRequest,
    user_id: UUID = Depends(get_current_user_id),
):
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    supabase = get_supabase()
    user_result = (
        supabase.table("users")
        .select("email, full_name")
        .eq("id", str(user_id))
        .maybe_single()
        .execute()
    )
    sub_result = (
        supabase.table("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    customer_id = sub_result.data.get("stripe_customer_id") if sub_result.data else None

    if not customer_id:
        customer = stripe.Customer.create(
            email=user_result.data["email"],
            name=user_result.data.get("full_name"),
            metadata={"user_id": str(user_id)},
        )
        customer_id = customer.id
        supabase.table("subscriptions").update(
            {"stripe_customer_id": customer_id}
        ).eq("user_id", str(user_id)).execute()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
        success_url=f"{settings.frontend_url}/dashboard?checkout=success",
        cancel_url=f"{settings.frontend_url}/#pricing?checkout=cancelled",
        metadata={"user_id": str(user_id)},
    )

    return CheckoutResponse(checkout_url=session.url)
