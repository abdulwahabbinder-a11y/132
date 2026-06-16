from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, billing, story
from app.core.database import Base, engine
from app.core.logging import configure_logging
from app.workers.pipeline_worker import pipeline_worker


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await pipeline_worker.start()
    yield


app = FastAPI(
    title="AI Documentary Video Generator API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(story.router, prefix="/api")
app.include_router(billing.router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
