"""DeepVideo-V1 neural rendering microservice client.

DeepVideo-V1 takes the LivePortrait output and applies advanced character neural
rendering: high-fidelity synthesis, realistic micro-expressions, and temporal
consistency (anti-flicker / anti-warp). Runs as a self-hosted GPU microservice
(see ``DEEPVIDEO_V1_ENDPOINT``).
"""

from __future__ import annotations

from pathlib import Path

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger
from app.services import storage


class DeepVideoNotConfiguredError(RuntimeError):
    pass


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=2, max=45), reraise=True)
async def enhance_clip(
    *,
    video_path: str,
    character_name: str | None = None,
    reference_image_path: str | None = None,
) -> dict:
    """Run a clip through DeepVideo-V1 for temporally-consistent enhancement."""
    if not settings.deepvideo_v1_endpoint:
        raise DeepVideoNotConfiguredError("DEEPVIDEO_V1_ENDPOINT is not set.")

    logger.info("DeepVideo-V1 enhancing {} ({})", video_path, character_name)
    files = {"clip": (Path(video_path).name, Path(video_path).read_bytes())}
    if reference_image_path:
        files["reference"] = (
            Path(reference_image_path).name,
            Path(reference_image_path).read_bytes(),
        )

    async with httpx.AsyncClient(timeout=900) as client:
        resp = await client.post(
            f"{settings.deepvideo_v1_endpoint.rstrip('/')}/render",
            files=files,
            data={
                "character_name": character_name or "",
                # Tuning knobs for temporal consistency & expression fidelity.
                "temporal_consistency": "high",
                "micro_expressions": "true",
                "anti_flicker": "true",
            },
        )
        resp.raise_for_status()
        video_bytes = resp.content

    path = storage.save_bytes(video_bytes, suffix=".mp4", subdir="deepvideo")
    return {
        "source": "deepvideo_v1",
        "type": "video",
        "url": storage.public_url(path),
        "local_path": path,
    }
