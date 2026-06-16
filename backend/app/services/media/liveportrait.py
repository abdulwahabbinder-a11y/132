"""LivePortrait lip-sync for historical character scenes."""

from __future__ import annotations

import base64
import uuid
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.logging import logger


async def lipsync_with_liveportrait(
    *,
    portrait_path: Path,
    audio_path: Path,
    job_id: uuid.UUID,
    scene_number: int,
) -> Path:
    """Drive a portrait with the narration audio and return the synced clip."""
    url = f"{settings.nvidia_nim_base_url.rstrip('/')}/character/liveportrait/invoke"
    headers = {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.nim_model_liveportrait,
        "source_image_base64": base64.b64encode(portrait_path.read_bytes()).decode(),
        "driving_audio_base64": base64.b64encode(audio_path.read_bytes()).decode(),
        "preserve_identity": True,
        "stitch_mode": "full",
    }

    async with httpx.AsyncClient(timeout=600.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    video_b64 = data.get("video_base64") or data.get("output", {}).get("video_base64")
    if not video_b64:
        raise RuntimeError(f"LivePortrait missing video payload: {list(data.keys())}")

    out_dir = settings.storage_root / str(job_id) / "liveportrait"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"scene-{scene_number:03d}.mp4"
    out_path.write_bytes(base64.b64decode(video_b64))

    logger.info("LivePortrait lipsynced clip saved: {}", out_path)
    return out_path
