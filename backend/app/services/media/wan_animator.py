"""NVIDIA NIM Wan 2.1 still-to-motion animator."""

from __future__ import annotations

import uuid
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.logging import logger
from app.services.llm.nim_client import NimChatClient


async def animate_still(
    *,
    image_url: str,
    prompt: str,
    job_id: uuid.UUID,
    scene_number: int,
    duration_seconds: float = 4.0,
    fps: int = 24,
) -> Path:
    """Animate a still into a short cinematic clip via Wan 2.1."""
    enriched_prompt = (
        f"Slow cinematic camera move, smooth parallax, documentary photography, "
        f"natural film grain. {prompt}"
    )

    async with NimChatClient() as client:
        response = await client.video_generation(
            model=settings.nim_model_wan,
            prompt=enriched_prompt,
            image_url=image_url,
            duration_seconds=duration_seconds,
            fps=fps,
            extra={"motion_strength": 0.55},
        )

    video_url = (
        response.get("data", [{}])[0].get("url")
        or response.get("video_url")
    )
    if not video_url:
        raise RuntimeError(f"Wan 2.1 response missing url: {response}")

    out_dir = settings.storage_root / str(job_id) / "wan"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"scene-{scene_number:03d}.mp4"

    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("GET", video_url) as r:
            r.raise_for_status()
            with out_path.open("wb") as fh:
                async for chunk in r.aiter_bytes(1 << 16):
                    fh.write(chunk)

    logger.info("Wan 2.1 clip saved: {}", out_path)
    return out_path
