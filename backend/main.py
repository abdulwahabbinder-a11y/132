"""
DocuAI Platform — FastAPI Backend Entry Point
"""

import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import create_tables
from app.api import api_router

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("docuai.startup", env=settings.APP_ENV)
    await create_tables()
    yield
    logger.info("docuai.shutdown")


app = FastAPI(
    title="DocuAI Platform API",
    description=(
        "Production-ready SaaS backend for the AI Documentary Video Generator. "
        "Handles authentication, subscription management, LLM scripting, "
        "media scraping, and orchestrated video pipeline."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Middleware ──────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.APP_ENV == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["api.docuai.com", "*.docuai.com"])

# ── Routes ──────────────────────────────────────────────────────────────────────

app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0", "env": settings.APP_ENV}


# ── Global Exception Handler ───────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logger.error("unhandled_exception", path=str(request.url), error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )
