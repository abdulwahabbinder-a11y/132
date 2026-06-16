"""API route aggregation."""

from fastapi import APIRouter

from app.api.routes import account, billing, generate, videos, webhooks

api_router = APIRouter()
api_router.include_router(account.router, tags=["account"])
api_router.include_router(generate.router, tags=["generation"])
api_router.include_router(videos.router, tags=["videos"])
api_router.include_router(billing.router, tags=["billing"])
api_router.include_router(webhooks.router, tags=["webhooks"])

__all__ = ["api_router"]
