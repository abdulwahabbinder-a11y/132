from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import httpx

from app.core.config import Settings
from app.schemas import AuthenticatedUser, SubscriptionState


class SupabaseGateway:
    """Small async wrapper around Supabase Auth and PostgREST APIs."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = str(settings.supabase_url).rstrip("/")

    def _service_headers(self) -> dict[str, str]:
        return {
            "apikey": self.settings.supabase_service_role_key,
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _anon_headers(self, bearer_token: str) -> dict[str, str]:
        return {
            "apikey": self.settings.supabase_anon_key,
            "Authorization": f"Bearer {bearer_token}",
        }

    async def get_auth_user(self, bearer_token: str) -> AuthenticatedUser:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{self.base_url}/auth/v1/user",
                headers=self._anon_headers(bearer_token),
            )
        response.raise_for_status()
        payload = response.json()
        return AuthenticatedUser(id=payload["id"], email=payload.get("email"))

    async def ensure_user_profile(self, user: AuthenticatedUser) -> None:
        payload = {"id": str(user.id), "email": user.email}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/users",
                params={"on_conflict": "id"},
                headers={**self._service_headers(), "Prefer": "resolution=merge-duplicates"},
                json=payload,
            )
        response.raise_for_status()

    async def get_or_create_subscription(self, user_id: UUID) -> SubscriptionState:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                f"{self.base_url}/rest/v1/subscriptions",
                params={"user_id": f"eq.{user_id}", "select": "*", "limit": "1"},
                headers=self._service_headers(),
            )
            response.raise_for_status()
            rows = response.json()
            if rows:
                return self._subscription_from_row(rows[0])

            create_response = await client.post(
                f"{self.base_url}/rest/v1/subscriptions",
                headers=self._service_headers(),
                json={"user_id": str(user_id), "plan_type": "free", "video_credits_left": 1},
            )
            create_response.raise_for_status()
            return self._subscription_from_row(create_response.json()[0])

    async def decrement_video_credit(self, user_id: UUID) -> int:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/rpc/decrement_video_credit",
                headers=self._service_headers(),
                json={"target_user_id": str(user_id)},
            )
        response.raise_for_status()
        return int(response.json())

    async def reset_subscription_credits(
        self,
        *,
        stripe_customer_id: str,
        plan_type: str = "pro",
        billing_cycle_end: datetime | None = None,
        metadata_user_id: str | None = None,
    ) -> None:
        payload: dict[str, Any] = {
            "plan_type": plan_type,
            "stripe_customer_id": stripe_customer_id,
            "video_credits_left": 30,
            "billing_cycle_end": billing_cycle_end.isoformat() if billing_cycle_end else None,
        }

        async with httpx.AsyncClient(timeout=20) as client:
            if metadata_user_id:
                upsert_payload = {"user_id": metadata_user_id, **payload}
                response = await client.post(
                    f"{self.base_url}/rest/v1/subscriptions",
                    params={"on_conflict": "user_id"},
                    headers={**self._service_headers(), "Prefer": "resolution=merge-duplicates"},
                    json=upsert_payload,
                )
            else:
                response = await client.patch(
                    f"{self.base_url}/rest/v1/subscriptions",
                    params={"stripe_customer_id": f"eq.{stripe_customer_id}"},
                    headers=self._service_headers(),
                    json=payload,
                )
            response.raise_for_status()

    async def create_generation_job(self, *, generation_id: UUID, user_id: UUID, topic: str, language: str, scenes: list[dict[str, Any]]) -> None:
        payload = {
            "id": str(generation_id),
            "user_id": str(user_id),
            "topic": topic,
            "language": language,
            "status": "queued",
            "story_json": scenes,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{self.base_url}/rest/v1/video_generations",
                headers=self._service_headers(),
                json=payload,
            )
        response.raise_for_status()

    async def update_generation_job(self, generation_id: UUID, **fields: Any) -> None:
        fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.patch(
                f"{self.base_url}/rest/v1/video_generations",
                params={"id": f"eq.{generation_id}"},
                headers=self._service_headers(),
                json=fields,
            )
        response.raise_for_status()

    @staticmethod
    def _subscription_from_row(row: dict[str, Any]) -> SubscriptionState:
        billing_cycle_end = row.get("billing_cycle_end")
        return SubscriptionState(
            user_id=row["user_id"],
            plan_type=row.get("plan_type") or "free",
            stripe_customer_id=row.get("stripe_customer_id"),
            video_credits_left=row.get("video_credits_left") or 0,
            billing_cycle_end=datetime.fromisoformat(billing_cycle_end) if billing_cycle_end else None,
        )
