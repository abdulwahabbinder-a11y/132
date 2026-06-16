"""Wikipedia / Wikidata fact fetcher.

Pulls a verifiable summary + key timeline facts for a topic to ground the
documentary in real, citable information.
"""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger

_REST_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
_API = "https://en.wikipedia.org/w/api.php"


def _headers() -> dict[str, str]:
    return {"User-Agent": settings.wikimedia_user_agent}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10), reraise=True)
async def fetch_summary(topic: str) -> dict | None:
    """Return a structured summary (title, extract, thumbnail, wikidata id)."""
    async with httpx.AsyncClient(timeout=30, headers=_headers()) as client:
        # Resolve the canonical page title first.
        search = await client.get(
            _API,
            params={
                "action": "query",
                "list": "search",
                "srsearch": topic,
                "format": "json",
                "srlimit": 1,
            },
        )
        search.raise_for_status()
        hits = search.json().get("query", {}).get("search", [])
        if not hits:
            logger.info("No Wikipedia page for '{}'", topic)
            return None

        title = hits[0]["title"].replace(" ", "_")
        resp = await client.get(_REST_SUMMARY.format(title=title))
        if resp.status_code != 200:
            return None
        data = resp.json()

    return {
        "title": data.get("title"),
        "extract": data.get("extract"),
        "description": data.get("description"),
        "thumbnail": (data.get("thumbnail") or {}).get("source"),
        "wikidata_id": (data.get("wikibase_item")),
        "content_url": (data.get("content_urls", {}).get("desktop", {}).get("page")),
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10), reraise=True)
async def fetch_timeline_facts(topic: str, *, limit: int = 8) -> list[str]:
    """Extract concise factual sentences from the page intro as a pseudo-timeline."""
    summary = await fetch_summary(topic)
    if not summary or not summary.get("extract"):
        return []
    sentences = [s.strip() for s in summary["extract"].split(". ") if s.strip()]
    return sentences[:limit]
