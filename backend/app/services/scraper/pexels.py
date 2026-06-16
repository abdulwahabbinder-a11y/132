"""Pexels stock video search."""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger

_SEARCH = "https://api.pexels.com/videos/search"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10), reraise=True)
async def search_videos(query: str, *, limit: int = 3) -> list[dict]:
    if not settings.pexels_api_key:
        logger.debug("Pexels API key not set; skipping")
        return []

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            _SEARCH,
            headers={"Authorization": settings.pexels_api_key},
            params={"query": query, "per_page": limit, "orientation": "landscape"},
        )
        resp.raise_for_status()
        videos = resp.json().get("videos", [])

    results: list[dict] = []
    for video in videos:
        files = sorted(
            video.get("video_files", []),
            key=lambda f: (f.get("width") or 0),
            reverse=True,
        )
        if not files:
            continue
        results.append(
            {
                "source": "pexels",
                "type": "video",
                "url": files[0]["link"],
                "width": files[0].get("width"),
                "height": files[0].get("height"),
                "duration": video.get("duration"),
                "credit": video.get("user", {}).get("name"),
            }
        )
    logger.debug("Pexels returned {} videos for '{}'", len(results), query)
    return results
