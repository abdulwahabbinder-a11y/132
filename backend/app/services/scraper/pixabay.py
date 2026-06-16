"""Pixabay stock video client (secondary B-roll source)."""

from __future__ import annotations

from typing import List

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

PIXABAY_VIDEO = "https://pixabay.com/api/videos/"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=1, max=10))
async def search_videos(query: str, *, per_page: int = 5) -> List[dict]:
    if not settings.pixabay_api_key:
        logger.warning("PIXABAY_API_KEY missing; skipping Pixabay search.")
        return []

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get(
            PIXABAY_VIDEO,
            params={
                "key": settings.pixabay_api_key,
                "q": query,
                "per_page": per_page,
                "video_type": "film",
            },
        )
        r.raise_for_status()
        hits = r.json().get("hits", [])

    out: list[dict] = []
    for h in hits:
        videos = h.get("videos") or {}
        best = videos.get("large") or videos.get("medium") or videos.get("small")
        if not best or not best.get("url"):
            continue
        out.append(
            {
                "url": best["url"],
                "kind": "video",
                "width": best.get("width"),
                "height": best.get("height"),
                "duration": h.get("duration"),
                "credit": h.get("user", "Pixabay"),
                "license": "Pixabay License",
                "source": "pixabay",
            }
        )
    return out
