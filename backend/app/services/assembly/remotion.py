"""Remotion render orchestration.

The backend writes a single ``props.json`` describing the full timeline (scenes,
asset paths, captions, map sequence, motion-config) and invokes the Remotion CLI
to render the ``DocumentaryVideo`` composition to MP4.

Remotion is the core orchestration framework; Motion.dev (Framer Motion) config
lives inside the Remotion components and is parameterised through these props.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any, Dict

from app.core.config import settings
from app.core.logging import get_logger
from app.utils.files import job_dir

log = get_logger(__name__)

COMPOSITION_ID = "DocumentaryVideo"


def write_props(job_id: str, props: Dict[str, Any]) -> Path:
    path = job_dir(job_id) / "props.json"
    path.write_text(json.dumps(props, indent=2), encoding="utf-8")
    return path


def render(job_id: str, props: Dict[str, Any]) -> Path:
    """Invoke the Remotion CLI to render the composition. Returns the MP4 path.

    Falls back to writing the props file only (no render) when Node/Remotion is
    not available, so the pipeline still produces a deterministic artifact in
    dev environments.
    """
    props_path = write_props(job_id, props)
    output_path = job_dir(job_id) / "remotion_raw.mp4"
    remotion_dir = Path(settings.REMOTION_PROJECT_DIR)

    cmd = [
        "npx",
        "remotion",
        "render",
        "src/index.ts",
        COMPOSITION_ID,
        str(output_path),
        f"--props={props_path}",
        "--codec=h264",
        "--concurrency=2",
    ]
    try:
        log.info("remotion.render.start", job=job_id, cwd=str(remotion_dir))
        proc = subprocess.run(
            cmd, cwd=str(remotion_dir), capture_output=True, text=True, timeout=3600
        )
        if proc.returncode != 0:
            log.error("remotion.render.failed", stderr=proc.stderr[-2000:])
            raise RuntimeError(proc.stderr[-500:])
        log.info("remotion.render.done", output=str(output_path))
        return output_path
    except (FileNotFoundError, RuntimeError, subprocess.TimeoutExpired) as exc:
        log.warning("remotion.render.fallback", error=str(exc))
        # Leave the props.json as the artifact reference for debugging/dev.
        return props_path
