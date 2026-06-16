import asyncio
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import SessionLocal
from app.models.video_job import VideoJob
from app.schemas.story import SceneSchema
from app.services.video_pipeline_service import VideoPipelineService

logger = logging.getLogger(__name__)


class PipelineWorker:
    def __init__(self) -> None:
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self.pipeline = VideoPipelineService()
        self.task: asyncio.Task | None = None

    async def start(self) -> None:
        if self.task and not self.task.done():
            return
        self.task = asyncio.create_task(self._run(), name="video-pipeline-worker")

    async def enqueue(self, job_id: uuid.UUID) -> None:
        await self.queue.put(str(job_id))

    async def _run(self) -> None:
        while True:
            job_id = await self.queue.get()
            try:
                await self._process(job_id)
            except Exception:  # noqa: BLE001
                logger.exception("Pipeline failed for job %s", job_id)
            finally:
                self.queue.task_done()

    async def _process(self, job_id: str) -> None:
        async with SessionLocal() as db:
            job = await self._load_job(db, job_id)
            if not job:
                return
            job.status = "processing"
            await db.commit()

            scenes = [SceneSchema(**item) for item in job.story_json["scenes"]]
            try:
                output = await self.pipeline.process_job(job_id=job_id, topic=job.topic, scenes=scenes)
                job.status = "completed"
                job.output_video_url = output
                job.error_message = None
            except Exception as exc:  # noqa: BLE001
                job.status = "failed"
                job.error_message = str(exc)
            await db.commit()

    @staticmethod
    async def _load_job(db: AsyncSession, job_id: str) -> VideoJob | None:
        result = await db.execute(select(VideoJob).where(VideoJob.id == job_id))
        return result.scalar_one_or_none()


pipeline_worker = PipelineWorker()
