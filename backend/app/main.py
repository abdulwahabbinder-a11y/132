"""FastAPI entry point — wires routers, middleware, lifecycle hooks."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app import __version__
from app.api import generate_story, stripe_webhook, subscriptions, videos
from app.config import settings
from app.core.logging import configure_logging


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    logger.info("Booting AI Documentary Video Generator API v{}", __version__)
    logger.info("Environment: {}", settings.app_env)
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="AI Documentary Video Generator",
    version=__version__,
    description=(
        "Production SaaS that orchestrates LLM scripting, public-data scraping, "
        "NVIDIA NIM (Flux/Wan2.1/LivePortrait/DeepVideo-V1), ElevenLabs TTS and "
        "Remotion.dev to render premium documentary videos."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_base_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------- Routers ---
app.include_router(stripe_webhook.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(subscriptions.router,  prefix="/api",          tags=["subscriptions"])
app.include_router(generate_story.router, prefix="/api",          tags=["generation"])
app.include_router(videos.router,         prefix="/api",          tags=["videos"])


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "version": __version__, "env": settings.app_env}
