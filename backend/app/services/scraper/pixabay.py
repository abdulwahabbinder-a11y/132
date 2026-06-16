"""Pixabay stock video search."""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger

_SEARCH = "https://pixabay.com/api/videos/"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10), reraise=True)
async def search_videos(query: str, *, limit: int = 3) -> list[dict]:
    if not settings.pixabay_api_key:
        logger.debug("Pixabay API key not set; skipping")
        return []

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            _SEARCH,
            params={
                "key": settings.pixabay_api_key,
                "q": query,
                "per_page": limit,
                "video_type": "film",
            },
        )
        resp.raise_for_status()
        hits = resp.json().get("hits", [])

    results: list[dict] = []
    for hit in hits:
        streams = hit.get("videos", {})
        best = streams.get("large") or streams.get("medium") or {}
        if not best.get("url"):
            continue
        results.append(
            {
                "source": "pixabay",
                "type": "video",
                "url": best["url"],
                "width": best.get("width"),
                "height": best.get("height"),
                "duration": hit.get("duration"),
                "credit": hit.get("user"),
            }
        )
    logger.debug("Pixabay returned {} videos for '{}'", len(results), query)
    return results
