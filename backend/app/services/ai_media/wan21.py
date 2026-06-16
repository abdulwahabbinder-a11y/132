"""NVIDIA NIM — AnyFlow Wan2.1-T2V-14B: animate stills into cinematic clips."""

from __future__ import annotations

import base64
from pathlib import Path

from loguru import logger

from app.config import settings
from app.services.ai_media.nim_client import invoke_with_polling


async def animate_image(
    *,
    image_path: Path,
    motion_prompt: str,
    out_path: Path,
    duration_s: float = 4.0,
    fps: int = 24,
) -> Path:
    """Convert a still into a 4s cinematic motion clip (subtle parallax/zoom)."""
    b64_img = base64.b64encode(image_path.read_bytes()).decode()
    payload = {
        "image": b64_img,
        "prompt": (
            f"{motion_prompt}. slow cinematic dolly, parallax, atmospheric, "
            f"documentary-grade, subtle camera drift"
        ),
        "num_frames": int(duration_s * fps),
        "fps": fps,
        "guidance_scale": 5.0,
    }
    logger.info("Wan2.1 animating {} ({}s, {} fps)", image_path.name, duration_s, fps)
    result = await invoke_with_polling(settings.nim_model_wan21, payload, timeout_s=600)

    b64_video = (
        result.get("video")
        or (result.get("artifacts") or [{}])[0].get("base64")
        or (result.get("data") or [{}])[0].get("b64_video")
    )
    if not b64_video:
        raise RuntimeError(f"Wan2.1 response missing video payload: keys={list(result)}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(b64_video))
    return out_path
