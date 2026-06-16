"""Pixabay stock-footage search."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

PIXABAY_VIDEO_API = "https://pixabay.com/api/videos/"


async def fetch_pixabay_videos(query: str, *, per_page: int = 5) -> list[dict[str, Any]]:
    if not settings.pixabay_api_key:
        return []

    params = {
        "key": settings.pixabay_api_key,
        "q": query,
        "per_page": max(3, min(per_page, 200)),
        "safesearch": "true",
        "video_type": "all",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(PIXABAY_VIDEO_API, params=params)
        if resp.status_code != 200:
            return []
        data = resp.json()

    out: list[dict[str, Any]] = []
    for hit in data.get("hits", []):
        videos = hit.get("videos", {})
        best = videos.get("large") or videos.get("medium") or videos.get("small")
        if not best or not best.get("url"):
            continue
        out.append(
            {
                "source": "pixabay",
                "id": hit.get("id"),
                "url": best["url"],
                "width": best.get("width"),
                "height": best.get("height"),
                "duration": hit.get("duration"),
                "user": hit.get("user"),
                "license": "Pixabay License",
            }
        )
    return out
