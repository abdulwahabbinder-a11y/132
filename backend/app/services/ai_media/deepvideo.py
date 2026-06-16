"""NVIDIA NIM — DeepVideo-V1: advanced character neural rendering.

Stage 2 of the historical-character pipeline. Takes the LivePortrait-driven
talking head and applies:
    * high-fidelity neural re-rendering
    * realistic micro-expressions
    * temporal consistency (suppress flicker / warping)
"""

from __future__ import annotations

import base64
from pathlib import Path

from loguru import logger

from app.config import settings
from app.services.ai_media.nim_client import invoke_with_polling


async def enhance(
    *,
    source_clip_path: Path,
    out_path: Path,
    style_reference_path: Path | None = None,
    temporal_consistency_strength: float = 0.9,
    micro_expression_strength: float = 0.75,
) -> Path:
    """Run DeepVideo-V1 over a draft talking-head clip and return a polished MP4."""
    payload: dict = {
        "input_video": base64.b64encode(source_clip_path.read_bytes()).decode(),
        "temporal_consistency": temporal_consistency_strength,
        "micro_expression": micro_expression_strength,
        "denoise_flicker": True,
        "preserve_identity": True,
        "upscale_to": "1080p",
    }
    if style_reference_path:
        payload["style_reference"] = base64.b64encode(style_reference_path.read_bytes()).decode()

    logger.info("DeepVideo-V1 enhancing {}", source_clip_path.name)
    result = await invoke_with_polling(settings.nim_model_deepvideo, payload, timeout_s=1200)

    b64_video = result.get("video") or result.get("output")
    if not b64_video:
        raise RuntimeError(f"DeepVideo response missing video: keys={list(result)}")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(b64_video))
    return out_path


async def render_character_scene(
    *,
    portrait_path: Path,
    audio_path: Path,
    work_dir: Path,
    scene_number: int,
) -> Path:
    """Two-stage helper: LivePortrait → DeepVideo-V1."""
    from app.services.ai_media.liveportrait import animate_portrait  # local import to avoid cycles

    draft_path = work_dir / f"scene_{scene_number:02d}_liveportrait.mp4"
    final_path = work_dir / f"scene_{scene_number:02d}_deepvideo.mp4"

    await animate_portrait(portrait_path=portrait_path, audio_path=audio_path, out_path=draft_path)
    await enhance(source_clip_path=draft_path, out_path=final_path)
    return final_path
