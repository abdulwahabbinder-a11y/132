from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from supabase import Client, create_client

from app.core.config import Settings
from app.models.domain import AuthenticatedUser, SubscriptionRecord


class SupabaseService:
    def __init__(self, settings: Settings):
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError("Supabase URL and service-role key are required")
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    def get_user_from_token(self, token: str) -> AuthenticatedUser:
        response = self.client.auth.get_user(token)
        user = response.user
        if not user or not user.email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        return AuthenticatedUser(id=user.id, email=user.email)

    def ensure_profile(self, user: AuthenticatedUser) -> None:
        self.client.table("users").upsert(
            {"id": user.id, "email": user.email},
            on_conflict="id",
        ).execute()
        existing = (
            self.client.table("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .limit(1)
            .execute()
            .data
        )
        if not existing:
            self.client.table("subscriptions").insert(
                {
                    "user_id": user.id,
                    "plan_type": "free",
                    "video_credits_left": 3,
                }
            ).execute()

    def get_subscription(self, user_id: str) -> SubscriptionRecord:
        data = (
            self.client.table("subscriptions")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
        )
        if not data:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Subscription record not found",
            )
        record = data[0]
        return SubscriptionRecord(
            id=record["id"],
            user_id=record["user_id"],
            plan_type=record["plan_type"],
            video_credits_left=record["video_credits_left"],
            stripe_customer_id=record.get("stripe_customer_id"),
            stripe_subscription_id=record.get("stripe_subscription_id"),
            billing_cycle_end=record.get("billing_cycle_end"),
        )

    def decrement_credit_or_402(self, user_id: str) -> int:
        subscription = self.get_subscription(user_id)
        if subscription.video_credits_left <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="No video credits left. Upgrade or wait for the next billing cycle.",
            )
        credits_left = subscription.video_credits_left - 1
        self.client.table("subscriptions").update(
            {"video_credits_left": credits_left}
        ).eq("id", subscription.id).execute()
        return credits_left

    def reset_subscription_from_stripe(
        self,
        *,
        stripe_customer_id: str,
        stripe_subscription_id: str,
        user_id: str | None,
        billing_cycle_end: datetime | None,
    ) -> None:
        update_payload: dict[str, Any] = {
            "plan_type": "pro",
            "stripe_customer_id": stripe_customer_id,
            "stripe_subscription_id": stripe_subscription_id,
            "video_credits_left": 30,
            "billing_cycle_end": billing_cycle_end.isoformat()
            if billing_cycle_end
            else None,
        }

        query = self.client.table("subscriptions").update(update_payload)
        if user_id:
            query.eq("user_id", user_id).execute()
            return
        query.eq("stripe_customer_id", stripe_customer_id).execute()

    def create_video_job(
        self,
        *,
        user_id: str,
        topic: str,
        language: str,
        scenes: list[dict[str, Any]],
    ) -> str:
        data = (
            self.client.table("video_jobs")
            .insert(
                {
                    "user_id": user_id,
                    "topic": topic,
                    "language": language,
                    "status": "queued",
                    "story_json": scenes,
                }
            )
            .execute()
            .data
        )
        return data[0]["id"]

    def update_job(self, job_id: str, **values: Any) -> None:
        values["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.client.table("video_jobs").update(values).eq("id", job_id).execute()

    def get_job(self, job_id: str, user_id: str) -> dict[str, Any]:
        data = (
            self.client.table("video_jobs")
            .select("*")
            .eq("id", job_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
        )
        if not data:
            raise HTTPException(status_code=404, detail="Video job not found")
        return data[0]
