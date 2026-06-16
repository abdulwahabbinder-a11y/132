"""FastAPI application entry-point for DocuGen AI."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routes import api_router
from app.core.config import settings
from app.core.logging import configure_logging, logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("DocuGen AI starting (env={}, version={})", settings.app_env, __version__)
    yield
    logger.info("DocuGen AI shutting down")


app = FastAPI(
    title="DocuGen AI",
    version=__version__,
    description=(
        "Subscription-based AI Documentary Video Generator: scripting via NVIDIA "
        "NIM (Llama 3.1 / Qwen 2.5), multi-source archival scraping, ElevenLabs "
        "narration, DeepVideo-V1 character cinematics, Remotion + Motion.dev "
        "assembly, and 21:9 cinematic output."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_base_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/healthz", tags=["meta"])
async def healthz() -> dict[str, str]:
    return {"status": "ok", "version": __version__}
