import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_settings
from app.routers import admin, billing, generate, shorts, users, webhooks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """Allow configured production origins plus preview tunnels in debug mode."""

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        origin = request.headers.get("origin", "")

        if request.method == "OPTIONS" and origin:
            if settings.is_allowed_cors_origin(origin):
                response = JSONResponse({"status": "ok"})
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "*"
                response.headers["Access-Control-Allow-Headers"] = "*"
                response.headers["Vary"] = "Origin"
                return response

        response = await call_next(request)

        if origin and settings.is_allowed_cors_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Vary"] = "Origin"

        return response


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
    app.add_middleware(DynamicCORSMiddleware)

    api = settings.api_prefix
    app.include_router(webhooks.router, prefix=api)
    app.include_router(generate.router, prefix=api)
    app.include_router(shorts.router, prefix=api)
    app.include_router(admin.router, prefix=api)
    app.include_router(users.router, prefix=api)
    app.include_router(billing.router, prefix=api)

    async def health_check():
        return {"status": "healthy", "service": settings.app_name}

    app.add_api_route("/health", health_check, methods=["GET"])
    app.add_api_route(f"{api}/health", health_check, methods=["GET"])

    return app


app = create_app()
