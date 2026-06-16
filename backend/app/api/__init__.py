from fastapi import APIRouter
from .auth import router as auth_router
from .generate_story import router as story_router
from .webhooks import router as webhook_router
from .videos import router as videos_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(story_router, prefix="/generate-story", tags=["Story Generation"])
api_router.include_router(webhook_router, prefix="/webhooks", tags=["Webhooks"])
api_router.include_router(videos_router, prefix="/videos", tags=["Videos"])
