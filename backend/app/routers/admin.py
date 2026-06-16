from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import require_admin
from app.schemas.short import AdminSettingItem, AdminSettingsUpdate
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
