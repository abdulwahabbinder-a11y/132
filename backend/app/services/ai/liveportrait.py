"""LivePortrait lip-sync microservice client.

LivePortrait drives a still portrait with an audio slice to produce precise
lip-sync + head motion. Runs as a self-hosted GPU microservice (see
``LIVEPORTRAIT_ENDPOINT``).
"""

from __future__ import annotations

from pathlib import Path

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger
from app.services import storage


class LivePortraitNotConfiguredError(RuntimeError):
    pass


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=2, max=30), reraise=True)
async def animate_portrait(*, image_path: str, audio_path: str) -> dict:
    """Send portrait + audio to LivePortrait and store the lip-synced clip."""
    if not settings.liveportrait_endpoint:
        raise LivePortraitNotConfiguredError("LIVEPORTRAIT_ENDPOINT is not set.")

    logger.info("LivePortrait lip-syncing {} with {}", image_path, audio_path)
    async with httpx.AsyncClient(timeout=600) as client:
        files = {
            "source_image": (Path(image_path).name, Path(image_path).read_bytes()),
            "driving_audio": (Path(audio_path).name, Path(audio_path).read_bytes()),
        }
        resp = await client.post(
            f"{settings.liveportrait_endpoint.rstrip('/')}/animate",
            files=files,
        )
        resp.raise_for_status()
        video_bytes = resp.content

    path = storage.save_bytes(video_bytes, suffix=".mp4", subdir="liveportrait")
    return {
        "source": "liveportrait",
        "type": "video",
        "url": storage.public_url(path),
        "local_path": path,
    }
