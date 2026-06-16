"""DocuForge AI — FastAPI application entrypoint."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api.routes import auth, billing, generate_story, videos, webhooks_stripe
from app.core.config import settings
from app.core.logging import configure_logging, get_logger

configure_logging("DEBUG" if not settings.is_production else "INFO")
log = get_logger(__name__)

app = FastAPI(
    title="DocuForge AI",
    description="Subscription-based AI Documentary Video Generator (SaaS).",
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve rendered artifacts (renders, job assets) for local/dev usage.
_storage_root = Path(settings.RENDER_OUTPUT_DIR).resolve().parent
_storage_root.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_storage_root)), name="static")

# Routers
app.include_router(auth.router)
app.include_router(generate_story.router)
app.include_router(videos.router)
app.include_router(billing.router)
app.include_router(webhooks_stripe.router)


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {
        "status": "ok",
        "version": __version__,
        "environment": settings.ENVIRONMENT,
        "nim_enabled": settings.has_nim,
    }


@app.get("/", tags=["system"])
async def root() -> dict:
    return {"name": "DocuForge AI", "docs": "/docs", "health": "/health"}


@app.on_event("startup")
async def on_startup() -> None:
    log.info("app.startup", version=__version__, environment=settings.ENVIRONMENT)
