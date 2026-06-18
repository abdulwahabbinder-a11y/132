"""Stage pipeline assets into Remotion public/ and invoke headless render."""

from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Callable

logger = logging.getLogger(__name__)

LogFn = Callable[[str, str, int, str], None] | None


def get_remotion_project_dir() -> Path | None:
    override = os.environ.get("REMOTION_PROJECT_DIR")
    if override:
        path = Path(override)
        return path if path.is_dir() else None

    path = Path(__file__).resolve().parents[3] / "remotion"
    return path if path.is_dir() else None


def _stage_file(remotion_dir: Path, job_id: str, rel_dest: str, source: Path) -> str:
    if not source.is_file():
        raise FileNotFoundError(f"Asset not found: {source}")

    dest = remotion_dir / "public" / "jobs" / job_id / rel_dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)
    return f"jobs/{job_id}/{rel_dest}".replace("\\", "/")


def _cleanup_staged_job(remotion_dir: Path, job_id: str) -> None:
    job_public = remotion_dir / "public" / "jobs" / job_id
    if job_public.exists():
        shutil.rmtree(job_public, ignore_errors=True)


def _guess_ext(path: Path, default: str) -> str:
    return path.suffix if path.suffix else default


def prepare_viral_short_props(
    job_id: str,
    remotion_dir: Path,
    props: dict[str, Any],
) -> dict[str, Any]:
    staged_scenes: list[dict[str, Any]] = []

    for scene in props.get("scenes", []):
        scene_num = int(scene["scene_number"])
        prefix = f"scene_{scene_num:03d}"

        image_src = Path(scene["image_path"])
        audio_src = Path(scene["audio_path"])

        image_rel = f"{prefix}/image{_guess_ext(image_src, '.png')}"
        audio_rel = f"{prefix}/audio{_guess_ext(audio_src, '.mp3')}"

        staged_scenes.append({
            **scene,
            "image_path": _stage_file(remotion_dir, job_id, image_rel, image_src),
            "audio_path": _stage_file(remotion_dir, job_id, audio_rel, audio_src),
        })

    staged_props = {**props, "scenes": staged_scenes}
    return staged_props


def prepare_documentary_props(
    job_id: str,
    remotion_dir: Path,
    props: dict[str, Any],
) -> dict[str, Any]:
    staged_scenes: list[dict[str, Any]] = []

    for scene in props.get("scenes", []):
        staged = dict(scene)
        video_path = scene.get("video_path")

        if video_path:
            video_src = Path(video_path)
            if video_src.is_file():
                scene_num = int(scene["scene_number"])
                video_rel = f"scene_{scene_num:03d}/video{_guess_ext(video_src, '.mp4')}"
                staged["video_path"] = _stage_file(remotion_dir, job_id, video_rel, video_src)
            else:
                staged["video_path"] = None
        else:
            staged["video_path"] = None

        staged_scenes.append(staged)

    return {**props, "job_id": job_id, "scenes": staged_scenes}


def render_composition(
    *,
    job_id: str,
    composition_id: str,
    props: dict[str, Any],
    output_path: Path,
    log_fn: LogFn = None,
    timeout: int = 600,
) -> bool:
    remotion_dir = get_remotion_project_dir()
    if not remotion_dir:
        if log_fn:
            log_fn("rendering", "Remotion project directory not found", 80, "warn")
        return False

    if not shutil.which("npx"):
        if log_fn:
            log_fn("rendering", "Node.js/npx not installed — cannot run Remotion", 80, "warn")
        return False

    node_modules = remotion_dir / "node_modules"
    if not node_modules.exists():
        if log_fn:
            log_fn("rendering", "Remotion dependencies missing — run npm install in remotion/", 80, "warn")
        return False

    props_path = output_path.parent / f"remotion_props_{job_id}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        props_path.write_text(json.dumps(props, indent=2))

        cmd = [
            "npx",
            "remotion",
            "render",
            "src/index.ts",
            composition_id,
            str(output_path),
            "--props",
            str(props_path),
            "--log=warn",
        ]

        if log_fn:
            log_fn("rendering", f"Remotion rendering {composition_id}...", 78, "info")

        result = subprocess.run(
            cmd,
            cwd=str(remotion_dir),
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        if result.returncode != 0:
            err = (result.stderr or result.stdout or "unknown error")[:800]
            logger.warning("Remotion render failed: %s", err)
            if log_fn:
                log_fn("rendering", f"Remotion render failed: {err[:200]}", 82, "warn")
            return False

        if not output_path.is_file() or output_path.stat().st_size < 1000:
            if log_fn:
                log_fn("rendering", "Remotion produced empty output", 82, "warn")
            return False

        if log_fn:
            log_fn(
                "rendering",
                f"Remotion render complete ({output_path.stat().st_size // 1024} KB)",
                88,
                "success",
            )
        return True

    except subprocess.TimeoutExpired:
        if log_fn:
            log_fn("rendering", "Remotion render timed out after 10 minutes", 82, "warn")
        return False
    except FileNotFoundError as exc:
        if log_fn:
            log_fn("rendering", str(exc), 82, "warn")
        return False
    finally:
        props_path.unlink(missing_ok=True)


def render_viral_short(
    *,
    job_id: str,
    props: dict[str, Any],
    output_path: Path,
    log_fn: LogFn = None,
) -> bool:
    remotion_dir = get_remotion_project_dir()
    if not remotion_dir:
        return False

    try:
        staged_props = prepare_viral_short_props(job_id, remotion_dir, props)
        return render_composition(
            job_id=job_id,
            composition_id="ViralShortComposition",
            props=staged_props,
            output_path=output_path,
            log_fn=log_fn,
        )
    finally:
        if remotion_dir:
            _cleanup_staged_job(remotion_dir, job_id)


def render_documentary(
    *,
    job_id: str,
    props: dict[str, Any],
    output_path: Path,
    log_fn: LogFn = None,
) -> bool:
    remotion_dir = get_remotion_project_dir()
    if not remotion_dir:
        return False

    try:
        staged_props = prepare_documentary_props(job_id, remotion_dir, props)
        return render_composition(
            job_id=job_id,
            composition_id="DocumentaryComposition",
            props=staged_props,
            output_path=output_path,
            log_fn=log_fn,
        )
    finally:
        if remotion_dir:
            _cleanup_staged_job(remotion_dir, job_id)
