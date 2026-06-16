"""Invoke Remotion to render the documentary composition.

Calls `npx remotion render` against the React-based composition under
`/remotion`. We pass the entire asset manifest as `--props` so the React
components can lay out scenes, maps, subtitles, and Motion.dev transitions
deterministically.
"""

from __future__ import annotations

import json
import subprocess
import uuid
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.logging import logger

REMOTION_ROOT = Path(__file__).resolve().parents[4] / "remotion"
DEFAULT_COMPOSITION = "Documentary"


def render_with_remotion(
    *,
    manifest: dict[str, Any],
    job_id: uuid.UUID,
    composition: str = DEFAULT_COMPOSITION,
) -> Path:
    """Render the documentary composition and return the resulting MP4 path."""
    out_dir = settings.storage_root / str(job_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_path = out_dir / "remotion-out.mp4"

    props_path = out_dir / "props.json"
    props_path.write_text(json.dumps(manifest, indent=2, default=str))

    cmd = [
        "npx", "remotion", "render",
        "src/index.ts", composition, str(output_path),
        f"--props={props_path}",
        f"--width={settings.output_width}",
        f"--height={settings.output_height}",
        f"--fps={settings.output_fps}",
        "--codec=h264",
        "--crf=18",
        "--concurrency=2",
        "--log=info",
    ]

    logger.info("Remotion render: cwd={}, cmd={}", REMOTION_ROOT, " ".join(cmd))
    proc = subprocess.run(
        cmd,
        cwd=REMOTION_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    logger.debug("Remotion stdout: {}", proc.stdout[-2000:])
    return output_path
