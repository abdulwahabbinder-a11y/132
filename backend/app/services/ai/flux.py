"""Flux text-to-image generation (abstract / AI-art scenes) via NVIDIA NIM."""

from __future__ import annotations

from app.config import settings
from app.core.logging import logger
from app.services import storage
from app.services.ai.nim_client import NIMClient, get_nim_client


def _build_prompt(keywords: list[str], narration: str) -> str:
    kw = ", ".join(keywords) if keywords else narration
    return (
        f"photorealistic cinematic documentary still, {kw}. "
        "dramatic lighting, film grain, 35mm, ultra-detailed, 21:9 composition, "
        "no text, no watermark"
    )


async def generate_abstract_image(
    *,
    keywords: list[str],
    narration: str,
    nim: NIMClient | None = None,
) -> dict:
    """Generate a photorealistic image for an abstract scene and store it."""
    nim = nim or get_nim_client()
    prompt = _build_prompt(keywords, narration)
    logger.info("Flux generating abstract image: {}", prompt[:80])
    image_bytes = await nim.generate_image(
        model=settings.nim_model_flux,
        prompt=prompt,
        width=1344,
        height=576,
    )
    path = storage.save_bytes(image_bytes, suffix=".png", subdir="flux")
    return {
        "source": "flux",
        "type": "image",
        "url": storage.public_url(path),
        "local_path": path,
        "prompt": prompt,
    }
