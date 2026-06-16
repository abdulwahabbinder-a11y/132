"""Stock B-roll video from the Pixabay API."""

from __future__ import annotations

from typing import Dict, List

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

PIXABAY_VIDEO_SEARCH = "https://pixabay.com/api/videos/"


async def search_videos(query: str, limit: int = 3) -> List[Dict[str, str]]:
    if not settings.PIXABAY_API_KEY:
        log.warning("pixabay.no_key")
        return []

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            PIXABAY_VIDEO_SEARCH,
            params={
                "key": settings.PIXABAY_API_KEY,
                "q": query,
                "per_page": limit,
                "video_type": "film",
            },
        )
        resp.raise_for_status()
        hits = resp.json().get("hits", [])

    results: List[Dict[str, str]] = []
    for h in hits:
        streams = h.get("videos", {})
        best = streams.get("large") or streams.get("medium") or streams.get("small")
        if not best:
            continue
        results.append(
            {
                "url": best["url"],
                "source_url": h.get("pageURL", ""),
                "provider": "pixabay",
                "author": h.get("user", ""),
                "duration": h.get("duration", 0),
            }
        )
    log.info("pixabay.search", query=query, count=len(results))
    return results
