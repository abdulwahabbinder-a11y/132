from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health_router, story_router, stripe_router
from app.core.config import get_settings
from app.core.database import initialize_database

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.media_storage_root_abs.mkdir(parents=True, exist_ok=True)
    await initialize_database()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.web_origin)],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(stripe_router, prefix=settings.api_v1_prefix)
app.include_router(story_router, prefix=settings.api_v1_prefix)
