"""Wikimedia Commons image search."""

from __future__ import annotations

from typing import Any

import httpx

COMMONS_API = "https://commons.wikimedia.org/w/api.php"


async def fetch_commons_images(query: str, *, limit: int = 6) -> list[dict[str, Any]]:
    """Return image URLs + metadata for a search term."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrlimit": limit,
        "gsrnamespace": 6,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
        "iiurlwidth": 1920,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(COMMONS_API, params=params)
        if resp.status_code != 200:
            return []
        data = resp.json()

    pages = data.get("query", {}).get("pages", {})
    results: list[dict[str, Any]] = []
    for page in pages.values():
        info_list = page.get("imageinfo") or []
        if not info_list:
            continue
        info = info_list[0]
        meta = info.get("extmetadata", {})
        results.append(
            {
                "source": "wikimedia",
                "title": page.get("title"),
                "url": info.get("thumburl") or info.get("url"),
                "descriptionurl": info.get("descriptionurl"),
                "mime": info.get("mime"),
                "width": info.get("thumbwidth") or info.get("width"),
                "height": info.get("thumbheight") or info.get("height"),
                "license": (meta.get("LicenseShortName") or {}).get("value"),
                "artist": (meta.get("Artist") or {}).get("value"),
            }
        )
    return results
