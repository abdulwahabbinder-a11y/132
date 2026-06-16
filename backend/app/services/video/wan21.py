"""Animate static images into 4-second cinematic motion clips.

Primary path: NVIDIA NIM ``AnyFlow-Wan2.1-T2V-14B`` image-to-video.
Fallback path: when NIM is unavailable, emit a Ken-Burns instruction so the
Remotion layer performs a deterministic slow pan/zoom on the still instead.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from app.core.logging import get_logger
from app.services.nim_client import nim_client
from app.utils.files import write_bytes

log = get_logger(__name__)


def _motion_prompt(narration: str, keywords: list[str]) -> str:
    kw = ", ".join(keywords) if keywords else "subtle parallax"
    return (
        f"Slow cinematic camera move, gentle parallax and dolly, documentary feel. "
        f"Scene: {narration}. Motion cues: {kw}. Keep temporally consistent, no warping."
    )


async def animate_still(
    job_id: str,
    scene_number: int,
    image_path: Path,
    narration: str,
    keywords: list[str],
    duration_s: int = 4,
) -> Dict[str, Any]:
    prompt = _motion_prompt(narration, keywords)
    image_bytes = image_path.read_bytes()
    video_bytes = await nim_client.animate_image_to_video(image_bytes, prompt, duration_s)

    # If NIM returned the original image bytes (mock/fallback), signal Ken-Burns.
    if video_bytes == image_bytes:
        log.info("wan21.fallback_kenburns", scene=scene_number)
        return {
            "type": "ken_burns",
            "image_path": str(image_path),
            "duration": duration_s,
        }

    out_path = write_bytes(job_id, f"scene_{scene_number:03d}_wan21.mp4", video_bytes)
    log.info("wan21.animated", scene=scene_number, path=str(out_path))
    return {"type": "video", "video_path": str(out_path), "duration": duration_s}
