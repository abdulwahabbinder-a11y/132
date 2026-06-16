"""Local artifact storage helper.

For local dev assets are written under ``STORAGE_DIR``. In production this is the
seam where you would swap in Supabase Storage / S3 by re-implementing ``save_bytes``
and ``download`` to upload to a bucket and return public URLs.
"""

from __future__ import annotations

import uuid
from pathlib import Path

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger


def _root() -> Path:
    root = Path(settings.storage_dir)
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_bytes(data: bytes, *, suffix: str, subdir: str = "assets") -> str:
    folder = _root() / subdir
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{uuid.uuid4().hex}{suffix}"
    path.write_bytes(data)
    logger.debug("Saved {} bytes -> {}", len(data), path)
    return str(path)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=15), reraise=True)
async def download(url: str, *, suffix: str = "", subdir: str = "downloads") -> str:
    """Download a remote URL to local storage and return the file path."""
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        content = resp.content
    if not suffix:
        suffix = Path(url.split("?")[0]).suffix or ".bin"
    return save_bytes(content, suffix=suffix, subdir=subdir)


def public_url(path: str) -> str:
    """Map a local path to a URL served by the API static mount."""
    rel = Path(path).relative_to(_root())
    return f"/static/{rel.as_posix()}"
