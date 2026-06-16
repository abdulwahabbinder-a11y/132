"""Abstract / AI art via NVIDIA NIM `stabilityai/flux-1-dev`."""

from __future__ import annotations

from pathlib import Path

from app.core.logging import get_logger
from app.services.nim_client import nim_client
from app.utils.files import write_bytes

log = get_logger(__name__)


def _build_prompt(narration: str, keywords: list[str]) -> str:
    kw = ", ".join(keywords) if keywords else "cinematic abstract concept"
    return (
        f"Photorealistic cinematic still illustrating: {narration}. "
        f"Themes: {kw}. Dramatic volumetric lighting, film grain, shallow depth "
        f"of field, 21:9 widescreen, documentary mood, ultra detailed, 8k."
    )


async def generate_abstract_image(
    job_id: str, scene_number: int, narration: str, keywords: list[str]
) -> Path:
    prompt = _build_prompt(narration, keywords)
    log.info("flux.generate", job=job_id, scene=scene_number)
    image_bytes = await nim_client.generate_image(prompt)
    return write_bytes(job_id, f"scene_{scene_number:03d}_flux.png", image_bytes)
