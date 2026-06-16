"""Stock B-roll video from the Pexels API."""

from __future__ import annotations

from typing import Dict, List

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

PEXELS_VIDEO_SEARCH = "https://api.pexels.com/videos/search"


async def search_videos(query: str, limit: int = 3) -> List[Dict[str, str]]:
    if not settings.PEXELS_API_KEY:
        log.warning("pexels.no_key")
        return []

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            PEXELS_VIDEO_SEARCH,
            headers={"Authorization": settings.PEXELS_API_KEY},
            params={"query": query, "per_page": limit, "orientation": "landscape", "size": "large"},
        )
        resp.raise_for_status()
        videos = resp.json().get("videos", [])

    results: List[Dict[str, str]] = []
    for v in videos:
        files = sorted(
            v.get("video_files", []),
            key=lambda f: (f.get("width") or 0),
            reverse=True,
        )
        if not files:
            continue
        results.append(
            {
                "url": files[0]["link"],
                "source_url": v.get("url", ""),
                "provider": "pexels",
                "author": (v.get("user") or {}).get("name", ""),
                "duration": v.get("duration", 0),
            }
        )
    log.info("pexels.search", query=query, count=len(results))
    return results
