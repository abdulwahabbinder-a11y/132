"""Wan2.1 image-to-video animation via NVIDIA NIM.

Turns a static image (from Flux or Wikimedia) into a 4-second cinematic motion
clip with subtle parallax / camera movement (the "Ken Burns on steroids" effect).
"""

from __future__ import annotations

from pathlib import Path

from app.config import settings
from app.core.logging import logger
from app.services import storage
from app.services.ai.nim_client import NIMClient, get_nim_client


async def animate_image(
    image_path: str,
    *,
    motion_prompt: str = "slow cinematic dolly-in, subtle parallax, documentary",
    duration_seconds: int = 4,
    nim: NIMClient | None = None,
) -> dict:
    """Animate a still image into a short clip; returns stored clip info."""
    nim = nim or get_nim_client()
    image_bytes = Path(image_path).read_bytes()
    logger.info("Wan2.1 animating {} ({}s)", image_path, duration_seconds)
    video_bytes = await nim.image_to_video(
        model=settings.nim_model_wan,
        image_bytes=image_bytes,
        prompt=motion_prompt,
        duration_seconds=duration_seconds,
    )
    path = storage.save_bytes(video_bytes, suffix=".mp4", subdir="wan21")
    return {
        "source": "wan2.1",
        "type": "video",
        "url": storage.public_url(path),
        "local_path": path,
        "duration": duration_seconds,
    }
