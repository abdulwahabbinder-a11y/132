from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.story import router as story_router
from app.api.stripe_webhooks import router as stripe_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Documentary Video Generator API",
        version="0.1.0",
        description="Subscription SaaS API for automated premium documentary video generation.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(story_router)
    app.include_router(stripe_router)

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
