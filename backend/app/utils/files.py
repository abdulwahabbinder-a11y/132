"""Filesystem helpers for the asset pipeline."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


def job_dir(job_id: str) -> Path:
    base = Path(settings.RENDER_OUTPUT_DIR).resolve().parent / "jobs" / job_id
    base.mkdir(parents=True, exist_ok=True)
    return base


def write_bytes(job_id: str, filename: str, data: bytes) -> Path:
    path = job_dir(job_id) / filename
    path.write_bytes(data)
    return path


async def download_to(job_id: str, url: str, suffix: str) -> Path | None:
    """Download a remote asset into the job directory. Returns the local path."""
    name = hashlib.sha1(url.encode()).hexdigest()[:16] + suffix
    path = job_dir(job_id) / name
    if path.exists():
        return path
    try:
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": settings.WIKIMEDIA_USER_AGENT})
            resp.raise_for_status()
            path.write_bytes(resp.content)
            return path
    except Exception as exc:  # noqa: BLE001
        log.warning("download.failed", url=url, error=str(exc))
        return None


def public_url(path: Path) -> str:
    rel = os.path.relpath(path, Path(settings.RENDER_OUTPUT_DIR).resolve().parent)
    return f"{settings.PUBLIC_BASE_URL}/static/{rel.replace(os.sep, '/')}"
