"""Bridge to the Remotion render service.

The Remotion bundle (in `/remotion`) exposes a small HTTP server (or CLI) that
accepts a JSON payload describing scenes, audio paths, subtitle data and map
coordinates. This module submits jobs to that service and returns the resulting
MP4 path.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import httpx
from loguru import logger

from app.config import settings


async def render(
    *,
    composition_id: str,
    props: dict[str, Any],
    out_path: Path,
    timeout_s: int = 1800,
) -> Path:
    """Submit a Remotion render job and write the output MP4 to disk."""
    out_path.parent.mkdir(parents=True, exist_ok=True)

    url = f"{settings.remotion_renderer_url}/render"
    payload = {
        "composition": composition_id,
        "props": props,
        "codec": "h264",
        "crf": 18,
        "pixel_format": "yuv420p",
    }
    logger.info("Remotion render → composition={} props_size={}b",
                composition_id, len(json.dumps(props)))

    async with httpx.AsyncClient(timeout=timeout_s) as c:
        r = await c.post(url, json=payload)
        r.raise_for_status()
        out_path.write_bytes(r.content)

    return out_path


async def render_with_cli(
    *,
    composition_id: str,
    props_json_path: Path,
    out_path: Path,
) -> Path:
    """Fallback path: invoke the Remotion CLI directly (useful in dev)."""
    bundle = settings.remotion_bundle_path
    cmd = (
        f"npx remotion render {bundle}/src/index.ts {composition_id} "
        f"{out_path} --props={props_json_path} --codec=h264 --crf=18"
    )
    logger.debug("$ {}", cmd)
    proc = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"Remotion CLI failed:\n{stderr.decode(errors='ignore')}")
    return out_path
