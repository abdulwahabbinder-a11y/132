import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import billing, generate, users, webhooks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Path(settings.asset_storage_path).mkdir(parents=True, exist_ok=True)
    Path(settings.output_storage_path).mkdir(parents=True, exist_ok=True)
    logger.info("DocuForge AI backend started")
    yield
    logger.info("DocuForge AI backend shutting down")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        description="Subscription-based AI Documentary Video Generator",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api = settings.api_prefix
    app.include_router(webhooks.router, prefix=api)
    app.include_router(generate.router, prefix=api)
    app.include_router(users.router, prefix=api)
    app.include_router(billing.router, prefix=api)

    @app.get("/health")
    async def health():
        return {"status": "healthy", "service": settings.app_name}

    return app


app = create_app()
