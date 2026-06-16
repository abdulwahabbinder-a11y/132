"""DeepVideo-V1 neural character rendering pipeline.

Takes the LivePortrait lip-sync output and refines it for high-fidelity
character synthesis: realistic micro-expressions, temporal consistency, and
flicker/warp suppression. Runs against a self-hosted DeepVideo-V1 endpoint.

Pipeline for a historical-character scene:

    portrait + audio  ->  LivePortrait (coarse lip-sync)
                      ->  DeepVideo-V1 (neural refinement / temporal stabilise)
                      ->  final talking-head clip
"""

from __future__ import annotations

import base64
from pathlib import Path
from typing import Any, Dict

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import get_logger
from app.services.video import liveportrait
from app.utils.files import write_bytes

log = get_logger(__name__)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=20))
async def _refine(job_id: str, scene_number: int, coarse_video_path: Path) -> Dict[str, Any]:
    if not settings.DEEPVIDEO_V1_ENDPOINT:
        log.warning("deepvideo.no_endpoint", scene=scene_number)
        return {"type": "video", "video_path": str(coarse_video_path), "refined": False}

    payload = {
        "input_video": base64.b64encode(coarse_video_path.read_bytes()).decode(),
        "config": {
            "temporal_consistency": True,
            "micro_expressions": True,
            "deflicker": True,
            "anti_warp": True,
            "fidelity": "high",
        },
    }
    async with httpx.AsyncClient(timeout=900) as client:
        resp = await client.post(settings.DEEPVIDEO_V1_ENDPOINT, json=payload)
        resp.raise_for_status()
        out_b64 = resp.json()["video_base64"]

    out_path = write_bytes(
        job_id, f"scene_{scene_number:03d}_deepvideo.mp4", base64.b64decode(out_b64)
    )
    log.info("deepvideo.refined", scene=scene_number, path=str(out_path))
    return {"type": "video", "video_path": str(out_path), "refined": True}


async def render_character_scene(
    job_id: str,
    scene_number: int,
    portrait_path: Path,
    audio_path: Path,
) -> Dict[str, Any]:
    """Full historical-character cinematic: LivePortrait -> DeepVideo-V1."""
    coarse = await liveportrait.lip_sync(job_id, scene_number, portrait_path, audio_path)

    # If LivePortrait fell back (no endpoint), there is no coarse video to refine.
    if coarse.get("type") != "video":
        log.info("deepvideo.skip_no_coarse", scene=scene_number)
        return coarse

    return await _refine(job_id, scene_number, Path(coarse["video_path"]))
