"""NVIDIA NIM — Flux.1-dev image generation for abstract/concept scenes."""

from __future__ import annotations

import base64
from pathlib import Path

from loguru import logger

from app.config import settings
from app.services.ai_media.nim_client import invoke_with_polling


async def generate_image(
    *,
    prompt: str,
    out_path: Path,
    width: int = 1344,
    height: int = 576,   # ~21:9 aspect
    steps: int = 30,
    guidance: float = 3.5,
    seed: int | None = None,
) -> Path:
    """Render a single photorealistic still via Flux-1-dev and persist to disk."""
    payload = {
        "prompt": (
            f"{prompt}. cinematic, photorealistic, 35mm film grain, "
            f"shallow depth of field, dramatic lighting, documentary aesthetic, "
            f"ultra-detailed, 8k"
        ),
        "negative_prompt": "cartoon, anime, low quality, watermark, text, deformed",
        "width": width,
        "height": height,
        "num_inference_steps": steps,
        "guidance_scale": guidance,
        "seed": seed if seed is not None else -1,
    }
    logger.info("Flux render: {}", prompt[:80])
    result = await invoke_with_polling(settings.nim_model_flux, payload, timeout_s=300)

    b64 = (
        result.get("image")
        or (result.get("artifacts") or [{}])[0].get("base64")
        or (result.get("data") or [{}])[0].get("b64_json")
    )
    if not b64:
        raise RuntimeError(f"Flux response missing image payload: keys={list(result)}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(b64))
    return out_path
