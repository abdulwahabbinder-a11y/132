"""Admin user analytics and listing."""

from __future__ import annotations

import logging
from typing import Any

from app.config import get_settings
from app.database import get_supabase
from app.services.credits import credits_per_video

logger = logging.getLogger(__name__)

PLAN_CREDITS = {
    "free": lambda: get_settings().free_plan_credits,
    "pro": lambda: get_settings().pro_plan_monthly_credits,
}


def _job_counts_by_user(rows: list[dict], completed_only: bool = False) -> dict[str, dict[str, int]]:
    counts: dict[str, dict[str, int]] = {}
    for row in rows:
        uid = row.get("user_id")
        if not uid:
            continue
        if uid not in counts:
            counts[uid] = {"total": 0, "completed": 0, "failed": 0, "processing": 0}
        counts[uid]["total"] += 1
        status = row.get("status", "")
        if status == "completed":
            counts[uid]["completed"] += 1
        elif status == "failed":
            counts[uid]["failed"] += 1
        elif status in ("processing", "queued", "pending", "story_generated"):
            counts[uid]["processing"] += 1
    return counts


def get_admin_users_dashboard() -> dict[str, Any]:
    supabase = get_supabase()
    cost = credits_per_video()

    users_result = (
        supabase.table("users")
        .select("id, email, full_name, created_at, is_admin")
        .order("created_at", desc=True)
        .limit(500)
        .execute()
    )
    users = users_result.data or []

    subs_result = supabase.table("subscriptions").select("*").execute()
    subs_by_user = {s["user_id"]: s for s in (subs_result.data or [])}

    doc_jobs = (
        supabase.table("video_jobs")
        .select("user_id, status, created_at")
        .execute()
    ).data or []

    short_jobs = (
        supabase.table("short_video_jobs")
        .select("user_id, status, created_at")
        .execute()
    ).data or []

    doc_counts = _job_counts_by_user(doc_jobs)
    short_counts = _job_counts_by_user(short_jobs)

    last_activity: dict[str, str] = {}
    for job in doc_jobs + short_jobs:
        uid = job.get("user_id")
        created = job.get("created_at")
        if uid and created:
            if uid not in last_activity or created > last_activity[uid]:
                last_activity[uid] = created

    user_rows: list[dict[str, Any]] = []
    total_pro = 0
    total_free = 0
    total_videos_completed = 0

    for user in users:
        uid = user["id"]
        sub = subs_by_user.get(uid, {})
        plan = sub.get("plan_type", "free")
        credits_left = sub.get("video_credits_left", 0)

        if plan == "pro":
            total_pro += 1
        else:
            total_free += 1

        doc = doc_counts.get(uid, {"total": 0, "completed": 0, "failed": 0, "processing": 0})
        short = short_counts.get(uid, {"total": 0, "completed": 0, "failed": 0, "processing": 0})
        videos_completed = doc["completed"] + short["completed"]
        total_videos_completed += videos_completed

        plan_default = PLAN_CREDITS.get(plan, PLAN_CREDITS["free"])()
        credits_used_estimate = videos_completed * cost

        user_rows.append({
            "user_id": uid,
            "email": user.get("email", ""),
            "full_name": user.get("full_name") or "—",
            "plan_type": plan,
            "is_admin": bool(user.get("is_admin")),
            "signed_up_at": user.get("created_at"),
            "credits_remaining": credits_left,
            "credits_used_estimate": credits_used_estimate,
            "plan_credits_allocation": plan_default,
            "documentary_jobs": doc["total"],
            "documentary_completed": doc["completed"],
            "short_jobs": short["total"],
            "shorts_completed": short["completed"],
            "videos_completed": videos_completed,
            "jobs_failed": doc["failed"] + short["failed"],
            "jobs_in_progress": doc["processing"] + short["processing"],
            "last_active_at": last_activity.get(uid),
            "stripe_customer_id": sub.get("stripe_customer_id"),
            "billing_cycle_end": sub.get("billing_cycle_end"),
        })

    return {
        "summary": {
            "total_users": len(users),
            "pro_users": total_pro,
            "free_users": total_free,
            "total_videos_completed": total_videos_completed,
            "credits_per_video": cost,
        },
        "users": user_rows,
    }
