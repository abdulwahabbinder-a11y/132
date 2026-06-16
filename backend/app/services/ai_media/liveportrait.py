"""NVIDIA NIM — LivePortrait: drive a still portrait with an audio slice.

Stage 1 of the historical-character pipeline. Output (lip-synced talking head)
is then fed into DeepVideo-V1 for high-fidelity neural rendering and temporal
consistency.
"""

from __future__ import annotations

import base64
from pathlib import Path

from loguru import logger

from app.config import settings
from app.services.ai_media.nim_client import invoke_with_polling


async def animate_portrait(
    *,
    portrait_path: Path,
    audio_path: Path,
    out_path: Path,
    expression_intensity: float = 0.85,
) -> Path:
    """Generate a precise lip-synced talking-head clip from `portrait_path`."""
    payload = {
        "source_image": base64.b64encode(portrait_path.read_bytes()).decode(),
        "driving_audio": base64.b64encode(audio_path.read_bytes()).decode(),
        "expression_intensity": expression_intensity,
        "stabilize_head_pose": True,
        "preserve_identity": True,
    }
    logger.info("LivePortrait → {} ← {}", portrait_path.name, audio_path.name)
    result = await invoke_with_polling(settings.nim_model_liveportrait, payload, timeout_s=900)

    b64_video = result.get("video") or result.get("output")
    if not b64_video:
        raise RuntimeError(f"LivePortrait response missing video: keys={list(result)}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(b64_video))
    return out_path
