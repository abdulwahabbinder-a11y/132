"""LivePortrait lip-sync for historical characters.

Sends a character portrait + an audio slice to a self-hosted LivePortrait
inference endpoint and returns a lip-synced talking-head clip. Degrades to a
Ken-Burns still when the endpoint is not configured.
"""

from __future__ import annotations

import base64
from pathlib import Path
from typing import Any, Dict

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import get_logger
from app.utils.files import write_bytes

log = get_logger(__name__)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=15))
async def lip_sync(
    job_id: str,
    scene_number: int,
    portrait_path: Path,
    audio_path: Path,
) -> Dict[str, Any]:
    if not settings.LIVEPORTRAIT_ENDPOINT:
        log.warning("liveportrait.no_endpoint", scene=scene_number)
        return {"type": "ken_burns", "image_path": str(portrait_path)}

    payload = {
        "source_image": base64.b64encode(portrait_path.read_bytes()).decode(),
        "driving_audio": base64.b64encode(audio_path.read_bytes()).decode(),
        "stitching": True,
        "relative_motion": True,
    }
    async with httpx.AsyncClient(timeout=600) as client:
        resp = await client.post(settings.LIVEPORTRAIT_ENDPOINT, json=payload)
        resp.raise_for_status()
        video_b64 = resp.json()["video_base64"]

    out_path = write_bytes(
        job_id, f"scene_{scene_number:03d}_liveportrait.mp4", base64.b64decode(video_b64)
    )
    log.info("liveportrait.done", scene=scene_number, path=str(out_path))
    return {"type": "video", "video_path": str(out_path)}
