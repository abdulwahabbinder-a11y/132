from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import require_admin
from app.schemas.short import AdminSettingItem, AdminSettingsUpdate
from app.services.admin_users_service import get_admin_users_dashboard
from app.services.settings_service import (
    get_all_settings_for_admin,
    get_scraper_status,
    invalidate_settings_cache,
    update_platform_settings,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminStatusResponse(BaseModel):
    is_admin: bool
    settings_count: int


class ScraperStatusItem(BaseModel):
    id: str
    label: str
    enabled: bool
    configured: bool
    ready: bool


class AdminUserRow(BaseModel):
    user_id: str
    email: str
    full_name: str
    plan_type: str
    is_admin: bool
    signed_up_at: str | None
    credits_remaining: int
    credits_used_estimate: int
    plan_credits_allocation: int
    documentary_jobs: int
    documentary_completed: int
    short_jobs: int
    shorts_completed: int
    videos_completed: int
    jobs_failed: int
    jobs_in_progress: int
    last_active_at: str | None
    stripe_customer_id: str | None = None
    billing_cycle_end: str | None = None


class AdminUsersSummary(BaseModel):
    total_users: int
    pro_users: int
    free_users: int
    total_videos_completed: int
    credits_per_video: int


class AdminUsersResponse(BaseModel):
    summary: AdminUsersSummary
    users: list[AdminUserRow]


@router.get("/users", response_model=AdminUsersResponse)
async def list_users(admin_id: UUID = Depends(require_admin)):
    data = get_admin_users_dashboard()
    return data


@router.get("/scrapers", response_model=list[ScraperStatusItem])
async def get_scrapers_status(admin_id: UUID = Depends(require_admin)):
    return get_scraper_status()


@router.get("/status", response_model=AdminStatusResponse)
async def admin_status(admin_id: UUID = Depends(require_admin)):
    settings = get_all_settings_for_admin()
    return AdminStatusResponse(is_admin=True, settings_count=len(settings))


@router.get("/settings", response_model=list[AdminSettingItem])
async def get_settings(admin_id: UUID = Depends(require_admin)):
    rows = get_all_settings_for_admin()
    return [
        AdminSettingItem(
            key=row["key"],
            value=row.get("value", "") if not row.get("is_secret") else "",
            category=row["category"],
            label=row.get("label"),
            is_secret=row.get("is_secret", True),
            value_masked=row.get("value_masked"),
        )
        for row in rows
    ]


@router.put("/settings")
async def update_settings(
    body: AdminSettingsUpdate,
    admin_id: UUID = Depends(require_admin),
):
    update_platform_settings(body.settings, str(admin_id))
    invalidate_settings_cache()
    return {"status": "ok", "updated_keys": list(body.settings.keys())}
