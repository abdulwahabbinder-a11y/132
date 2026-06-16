"""Abstract / conceptual still generation via NVIDIA NIM Flux 1-dev."""

from __future__ import annotations

import base64
import uuid
from pathlib import Path

from app.core.config import settings
from app.core.logging import logger
from app.services.llm.nim_client import NimChatClient


async def generate_abstract_image(
    prompt: str,
    *,
    job_id: uuid.UUID,
    scene_number: int,
    width: int = 1920,
    height: int = 824,
) -> Path:
    """Generate a photorealistic abstract still and return its on-disk path."""
    enriched_prompt = (
        f"Cinematic documentary still, ultra-photoreal, 21:9 aspect, soft natural "
        f"lighting, depth of field. {prompt}"
    )
    negative = "low quality, blurry, watermark, text, logo, deformed, cartoon"

    async with NimChatClient() as client:
        response = await client.image_generation(
            model=settings.nim_model_flux,
            prompt=enriched_prompt,
            negative_prompt=negative,
            width=width,
            height=height,
        )

    image_b64 = (
        response.get("data", [{}])[0].get("b64_json")
        or response.get("artifacts", [{}])[0].get("base64")
    )
    if not image_b64:
        raise RuntimeError(f"Flux response missing base64 payload: {response}")

    out_dir = settings.storage_root / str(job_id) / "abstract"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"scene-{scene_number:03d}.png"
    path.write_bytes(base64.b64decode(image_b64))
    logger.info("Flux still saved: {}", path)
    return path
