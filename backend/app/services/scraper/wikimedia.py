"""Wikimedia Commons image search — archival/historical photo source."""

from __future__ import annotations

from typing import List

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

COMMONS_API = "https://commons.wikimedia.org/w/api.php"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=1, max=10))
async def search_images(query: str, *, limit: int = 6) -> List[dict]:
    """Search Commons for freely-licensed images matching `query`."""
    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "DocuGen/1.0"}) as c:
        r = await c.get(
            COMMONS_API,
            params={
                "action": "query",
                "generator": "search",
                "gsrsearch": f"filetype:bitmap {query}",
                "gsrlimit": limit,
                "prop": "imageinfo|info",
                "iiprop": "url|extmetadata|mime",
                "format": "json",
            },
        )
        r.raise_for_status()
        pages = (r.json().get("query") or {}).get("pages") or {}

    out: list[dict] = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        url = info.get("url")
        meta = info.get("extmetadata") or {}
        if not url:
            continue
        if (info.get("mime") or "").startswith("image/"):
            out.append(
                {
                    "url": url,
                    "kind": "image",
                    "credit": (meta.get("Artist", {}) or {}).get("value", "Wikimedia Commons"),
                    "license": (meta.get("LicenseShortName", {}) or {}).get("value", ""),
                    "source": "wikimedia_commons",
                }
            )
    return out
