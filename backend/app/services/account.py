"""Account service: user profile + subscription + credit accounting.

This is the single source of truth for credit checks/decrements. It talks to
Supabase via the service-role client so the server can enforce credits even when
RLS would otherwise restrict access.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.config import settings
from app.core.logging import logger
from app.core.supabase_client import get_supabase_admin
from app.models.subscription import PlanType, Subscription
from app.models.user import User

# Free tier gets a small monthly allowance so users can try the product.
FREE_PLAN_CREDITS = 3


class InsufficientCreditsError(Exception):
    """Raised when a user has no video credits left."""


class AccountService:
    """Per-request service. Call :meth:`bind` with the current user."""

    def __init__(self) -> None:
        self._user: User | None = None

    def bind(self, user: User) -> "AccountService":
        self._user = user
        return self

    @property
    def user(self) -> User:
        if self._user is None:
            raise RuntimeError("AccountService is not bound to a user.")
        return self._user

    # -- subscription -------------------------------------------------------
    def get_subscription(self) -> Subscription:
        """Fetch (or lazily create) the user's subscription row."""
        db = get_supabase_admin()
        resp = (
            db.table("subscriptions")
            .select("*")
            .eq("user_id", self.user.id)
            .limit(1)
            .execute()
        )
        if resp.data:
            return Subscription(**resp.data[0])
        return self._create_free_subscription()

    def _create_free_subscription(self) -> Subscription:
        db = get_supabase_admin()
        cycle_end = datetime.now(timezone.utc) + timedelta(days=30)
        payload = {
            "user_id": self.user.id,
            "plan_type": PlanType.FREE.value,
            "video_credits_left": FREE_PLAN_CREDITS,
            "billing_cycle_end": cycle_end.isoformat(),
        }
        resp = db.table("subscriptions").insert(payload).execute()
        logger.info("Created free subscription for user {}", self.user.id)
        return Subscription(**resp.data[0])

    # -- credit accounting --------------------------------------------------
    def ensure_credits(self) -> Subscription:
        """Raise :class:`InsufficientCreditsError` if the user has 0 credits."""
        sub = self.get_subscription()
        if sub.video_credits_left <= 0:
            raise InsufficientCreditsError(
                "You have no video credits left. Upgrade your plan to continue."
            )
        return sub

    def decrement_credit(self) -> int:
        """Atomically decrement a credit and return the new balance."""
        db = get_supabase_admin()
        # Prefer an atomic RPC (defined in the migration) to avoid race conditions.
        try:
            resp = db.rpc(
                "decrement_video_credit", {"p_user_id": self.user.id}
            ).execute()
            new_balance = int(resp.data)
            logger.info("User {} credits now {}", self.user.id, new_balance)
            return new_balance
        except Exception as exc:  # pragma: no cover - RPC fallback
            logger.warning("decrement RPC failed ({}); falling back to read/write", exc)
            sub = self.get_subscription()
            new_balance = max(sub.video_credits_left - 1, 0)
            db.table("subscriptions").update(
                {"video_credits_left": new_balance}
            ).eq("user_id", self.user.id).execute()
            return new_balance


def get_account_service() -> AccountService:
    return AccountService()


__all__ = [
    "AccountService",
    "InsufficientCreditsError",
    "get_account_service",
    "FREE_PLAN_CREDITS",
]
