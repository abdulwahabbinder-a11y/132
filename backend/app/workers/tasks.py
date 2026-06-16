import asyncio

from app.config import get_settings
from app.database import SessionLocal
from app.services.media_pipeline import MediaPipelineService
from app.services.providers import ProviderClients
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.process_project_assets")
def process_project_assets(project_id: str) -> None:
    asyncio.run(_process(project_id))


async def _process(project_id: str) -> None:
    settings = get_settings()
    providers = ProviderClients(settings)
    pipeline = MediaPipelineService(settings, providers)

    async with SessionLocal() as session:
        await pipeline.process_project(session, project_id)
