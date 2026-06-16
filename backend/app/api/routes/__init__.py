from fastapi import APIRouter

from . import stories, subscriptions, videos, webhooks_stripe

api_router = APIRouter()
api_router.include_router(stories.router, tags=["stories"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(webhooks_stripe.router, prefix="/webhooks", tags=["webhooks"])
