"""Pexels stock video client (B-roll source)."""

from __future__ import annotations

from typing import List

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

PEXELS_VIDEO = "https://api.pexels.com/videos/search"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=1, max=10))
async def search_videos(query: str, *, per_page: int = 5) -> List[dict]:
    if not settings.pexels_api_key:
        logger.warning("PEXELS_API_KEY missing; skipping Pexels search.")
        return []

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get(
            PEXELS_VIDEO,
            headers={"Authorization": settings.pexels_api_key},
            params={"query": query, "per_page": per_page, "orientation": "landscape"},
        )
        r.raise_for_status()
        videos = r.json().get("videos", [])

    out: list[dict] = []
    for v in videos:
        # Prefer ≥1080p HD asset.
        files = sorted(
            (f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4"),
            key=lambda f: f.get("height") or 0,
            reverse=True,
        )
        if not files:
            continue
        best = files[0]
        out.append(
            {
                "url": best["link"],
                "kind": "video",
                "width": best.get("width"),
                "height": best.get("height"),
                "duration": v.get("duration"),
                "credit": (v.get("user") or {}).get("name", "Pexels"),
                "license": "Pexels License",
                "source": "pexels",
            }
        )
    return out
