from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.api.dependencies import get_app_settings, get_supabase_service
from app.core.config import Settings
from app.services.supabase_service import SupabaseService

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
    settings: Settings = Depends(get_app_settings),
    supabase: SupabaseService = Depends(get_supabase_service),
) -> dict[str, str]:
    payload = await request.body()
    stripe.api_key = settings.stripe_secret_key

    if settings.stripe_webhook_secret:
        if not stripe_signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=stripe_signature,
                secret=settings.stripe_webhook_secret,
            )
        except (ValueError, stripe.SignatureVerificationError) as exc:
            raise HTTPException(status_code=400, detail="Invalid Stripe webhook") from exc
    else:
        event = stripe.Event.construct_from(await request.json(), stripe.api_key)

    if event["type"] == "customer.subscription.created":
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        user_id = (subscription.get("metadata") or {}).get("user_id")
        billing_cycle_end = _timestamp_to_datetime(
            subscription.get("current_period_end")
        )

        if not user_id and settings.stripe_secret_key:
            customer = stripe.Customer.retrieve(customer_id)
            user_id = (customer.get("metadata") or {}).get("user_id")

        supabase.reset_subscription_from_stripe(
            stripe_customer_id=customer_id,
            stripe_subscription_id=subscription["id"],
            user_id=user_id,
            billing_cycle_end=billing_cycle_end,
        )

    return {"received": "true"}


def _timestamp_to_datetime(value: int | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromtimestamp(value, tz=timezone.utc)
