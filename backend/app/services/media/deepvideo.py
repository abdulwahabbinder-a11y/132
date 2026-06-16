"""DeepVideo-V1 neural refinement for character cinematics.

The DeepVideo-V1 pipeline takes an existing lip-synced character clip
(typically from LivePortrait) and applies advanced temporal-consistent neural
rendering: high-fidelity skin micro-expressions, identity-preserving denoising,
and flicker / warp suppression across frames.
"""

from __future__ import annotations

import base64
import uuid
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.logging import logger


async def refine_with_deepvideo(
    *,
    video_path: Path,
    character_name: str,
    job_id: uuid.UUID,
    scene_number: int,
    strength: float = 0.85,
) -> Path:
    """Push a base clip through DeepVideo-V1 and return the refined output."""
    url = f"{settings.nvidia_nim_base_url.rstrip('/')}/character/deepvideo/refine"
    headers = {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.nim_model_deepvideo,
        "video_base64": base64.b64encode(video_path.read_bytes()).decode(),
        "subject_label": character_name,
        "temporal_consistency": True,
        "micro_expression_boost": True,
        "denoise_strength": strength,
        "fix_flicker": True,
        "fix_warp": True,
    }

    async with httpx.AsyncClient(timeout=900.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    out_b64 = data.get("video_base64") or data.get("output", {}).get("video_base64")
    if not out_b64:
        raise RuntimeError(f"DeepVideo-V1 missing video payload: {list(data.keys())}")

    out_dir = settings.storage_root / str(job_id) / "deepvideo"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"scene-{scene_number:03d}.mp4"
    out_path.write_bytes(base64.b64decode(out_b64))

    logger.info("DeepVideo-V1 refined clip saved: {}", out_path)
    return out_path
