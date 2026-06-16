"""Pexels stock-footage search."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

PEXELS_VIDEO_API = "https://api.pexels.com/videos/search"


async def fetch_pexels_videos(query: str, *, per_page: int = 5) -> list[dict[str, Any]]:
    if not settings.pexels_api_key:
        return []

    async with httpx.AsyncClient(
        timeout=20.0, headers={"Authorization": settings.pexels_api_key}
    ) as client:
        resp = await client.get(
            PEXELS_VIDEO_API,
            params={"query": query, "per_page": per_page, "orientation": "landscape"},
        )
        if resp.status_code != 200:
            return []
        data = resp.json()

    out: list[dict[str, Any]] = []
    for video in data.get("videos", []):
        files = sorted(
            (f for f in video.get("video_files", []) if f.get("file_type") == "video/mp4"),
            key=lambda f: f.get("width", 0),
            reverse=True,
        )
        if not files:
            continue
        best = files[0]
        out.append(
            {
                "source": "pexels",
                "id": video.get("id"),
                "url": best.get("link"),
                "width": best.get("width"),
                "height": best.get("height"),
                "duration": video.get("duration"),
                "user": (video.get("user") or {}).get("name"),
                "license": "Pexels License",
            }
        )
    return out
