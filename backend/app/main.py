"""FastAPI application entrypoint for DocuForge AI."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api.routes import api_router
from app.config import settings
from app.core.logging import configure_logging, logger

configure_logging()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "Subscription-based AI Documentary Video Generator — scripting router, "
            "public scraper, character cinematics, and Remotion assembly engine."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Serve generated artifacts (audio, clips, final MP4) in local dev.
    storage_dir = Path(settings.storage_dir)
    storage_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(storage_dir)), name="static")

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/health", tags=["system"])
    def health() -> dict:
        return {"status": "ok", "service": settings.app_name, "version": __version__}

    @app.on_event("startup")
    async def _startup() -> None:  # pragma: no cover - lifecycle glue
        logger.info("{} v{} starting ({})", settings.app_name, __version__, settings.environment)

    return app


app = create_app()
