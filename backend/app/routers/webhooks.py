import json
import logging
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.database import get_supabase
from app.services.stripe_config import stripe_secret_key, stripe_webhook_secret

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request):
    settings = get_settings()
    stripe.api_key = stripe_secret_key()
    webhook_secret = stripe_webhook_secret()

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe webhook secret not configured",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data_object)
    elif event_type == "customer.subscription.created":
        await _handle_subscription_created(data_object)
    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(data_object)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(data_object)
    elif event_type == "invoice.payment_succeeded":
        await _handle_invoice_paid(data_object)

    return {"status": "ok", "event": event_type}


async def _handle_checkout_completed(session: dict) -> None:
    settings = get_settings()
    supabase = get_supabase()
    customer_id = session.get("customer")
    user_id = (session.get("metadata") or {}).get("user_id")

    if user_id and customer_id:
        supabase.table("subscriptions").upsert(
            {
                "user_id": user_id,
                "stripe_customer_id": customer_id,
                "plan_type": "free",
                "video_credits_left": settings.free_plan_credits,
            },
            on_conflict="user_id",
        ).execute()


async def _handle_subscription_created(subscription: dict) -> None:
    settings = get_settings()
    supabase = get_supabase()
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    current_period_end = subscription.get("current_period_end")

    billing_end = (
        datetime.fromtimestamp(current_period_end, tz=timezone.utc)
        if current_period_end
        else None
    )

    result = (
        supabase.table("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customer_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        logger.warning("No user found for Stripe customer %s", customer_id)
        return

    supabase.table("subscriptions").update(
        {
            "plan_type": "pro",
            "stripe_subscription_id": subscription_id,
            "video_credits_left": settings.pro_plan_monthly_credits,
            "billing_cycle_end": billing_end.isoformat() if billing_end else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("stripe_customer_id", customer_id).execute()

    logger.info("Subscription created for customer %s — credits reset to %d", customer_id, settings.pro_plan_monthly_credits)


async def _handle_subscription_updated(subscription: dict) -> None:
    settings = get_settings()
    supabase = get_supabase()
    customer_id = subscription.get("customer")
    status_val = subscription.get("status")
    current_period_end = subscription.get("current_period_end")

    billing_end = (
        datetime.fromtimestamp(current_period_end, tz=timezone.utc)
        if current_period_end
        else None
    )

    update_data: dict = {
        "billing_cycle_end": billing_end.isoformat() if billing_end else None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if status_val == "active":
        update_data["plan_type"] = "pro"
    elif status_val in ("canceled", "unpaid", "past_due"):
        update_data["plan_type"] = "free"
        update_data["video_credits_left"] = settings.free_plan_credits

    supabase.table("subscriptions").update(update_data).eq(
        "stripe_customer_id", customer_id
    ).execute()


async def _handle_subscription_deleted(subscription: dict) -> None:
    settings = get_settings()
    supabase = get_supabase()
    customer_id = subscription.get("customer")

    supabase.table("subscriptions").update(
        {
            "plan_type": "free",
            "stripe_subscription_id": None,
            "video_credits_left": settings.free_plan_credits,
            "billing_cycle_end": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("stripe_customer_id", customer_id).execute()


async def _handle_invoice_paid(invoice: dict) -> None:
    settings = get_settings()
    supabase = get_supabase()
    customer_id = invoice.get("customer")
    billing_reason = invoice.get("billing_reason")

    if billing_reason != "subscription_cycle":
        return

    result = (
        supabase.table("subscriptions")
        .select("id")
        .eq("stripe_customer_id", customer_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        return

    supabase.table("subscriptions").update(
        {
            "video_credits_left": settings.pro_plan_monthly_credits,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("stripe_customer_id", customer_id).execute()

    logger.info("Renewal credits reset for customer %s", customer_id)
