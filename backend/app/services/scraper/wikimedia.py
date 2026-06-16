"""Wikimedia Commons archival media search."""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger

_COMMONS_API = "https://commons.wikimedia.org/w/api.php"


def _headers() -> dict[str, str]:
    return {"User-Agent": settings.wikimedia_user_agent}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10), reraise=True)
async def search_images(query: str, *, limit: int = 5) -> list[dict]:
    """Return public-domain / CC archival images for a query."""
    async with httpx.AsyncClient(timeout=30, headers=_headers()) as client:
        resp = await client.get(
            _COMMONS_API,
            params={
                "action": "query",
                "generator": "search",
                "gsrsearch": f"filetype:bitmap {query}",
                "gsrlimit": limit,
                "gsrnamespace": 6,  # File namespace
                "prop": "imageinfo",
                "iiprop": "url|extmetadata|mime",
                "iiurlwidth": 1600,
                "format": "json",
            },
        )
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})

    results: list[dict] = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        if not info.get("url"):
            continue
        meta = info.get("extmetadata", {})
        results.append(
            {
                "source": "wikimedia_commons",
                "type": "image",
                "url": info.get("thumburl") or info["url"],
                "full_url": info["url"],
                "mime": info.get("mime"),
                "license": (meta.get("LicenseShortName", {}) or {}).get("value"),
                "credit": (meta.get("Artist", {}) or {}).get("value"),
                "title": page.get("title"),
            }
        )
    logger.debug("Wikimedia returned {} images for '{}'", len(results), query)
    return results
