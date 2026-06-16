"""Archival photos from Wikimedia Commons."""

from __future__ import annotations

from typing import Dict, List

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

COMMONS_API = "https://commons.wikimedia.org/w/api.php"


def _headers() -> Dict[str, str]:
    return {"User-Agent": settings.WIKIMEDIA_USER_AGENT, "Accept": "application/json"}


async def search_images(query: str, limit: int = 5) -> List[Dict[str, str]]:
    """Search Commons for openly-licensed images matching the query."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            COMMONS_API,
            headers=_headers(),
            params={
                "action": "query",
                "generator": "search",
                "gsrsearch": f"{query} filetype:bitmap",
                "gsrnamespace": 6,  # File namespace
                "gsrlimit": limit,
                "prop": "imageinfo",
                "iiprop": "url|extmetadata|mime",
                "iiurlwidth": 1600,
                "format": "json",
            },
        )
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})

    results: List[Dict[str, str]] = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        if not info.get("url"):
            continue
        results.append(
            {
                "url": info.get("thumburl") or info.get("url"),
                "source_url": info.get("descriptionurl", ""),
                "license": (meta.get("LicenseShortName", {}) or {}).get("value", "unknown"),
                "artist": (meta.get("Artist", {}) or {}).get("value", ""),
                "provider": "wikimedia_commons",
                "mime": info.get("mime", "image/jpeg"),
            }
        )
    log.info("wikimedia.search", query=query, count=len(results))
    return results
