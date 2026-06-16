"""Wikipedia + Wikidata client for verifiable facts and timelines."""

from __future__ import annotations

from typing import List

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=1, max=10))
async def search_summary(topic: str) -> dict:
    """Return Wikipedia REST summary for the most relevant article."""
    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "DocuGen/1.0"}) as c:
        # 1) Find best matching page
        r = await c.get(
            WIKI_API,
            params={
                "action": "query",
                "list": "search",
                "srsearch": topic,
                "srlimit": 1,
                "format": "json",
            },
        )
        r.raise_for_status()
        hits = r.json().get("query", {}).get("search", [])
        if not hits:
            return {}
        title = hits[0]["title"]

        # 2) Fetch the REST summary
        s = await c.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
        )
        if s.status_code != 200:
            return {}
        return s.json()


async def get_facts(topic: str, *, limit: int = 8) -> List[str]:
    """Extract key timeline-style sentences from a Wikipedia article."""
    summary = await search_summary(topic)
    extract = summary.get("extract", "")
    if not extract:
        logger.warning("No Wikipedia extract found for topic '{}'", topic)
        return []
    # Naive sentence split is acceptable for headline facts.
    sentences = [s.strip() for s in extract.split(". ") if s.strip()]
    return sentences[:limit]


async def get_wikidata_timeline(qid: str) -> List[dict]:
    """Fetch significant events from Wikidata for a given Q-ID (best-effort)."""
    query = f"""
    SELECT ?event ?eventLabel ?date WHERE {{
      wd:{qid} wdt:P793 ?event.
      OPTIONAL {{ ?event wdt:P585 ?date. }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT 25
    """
    async with httpx.AsyncClient(
        timeout=30,
        headers={"User-Agent": "DocuGen/1.0", "Accept": "application/sparql-results+json"},
    ) as c:
        r = await c.get(WIKIDATA_SPARQL, params={"query": query, "format": "json"})
        if r.status_code != 200:
            return []
        bindings = r.json().get("results", {}).get("bindings", [])
        return [
            {
                "event": b.get("eventLabel", {}).get("value"),
                "date": b.get("date", {}).get("value"),
            }
            for b in bindings
        ]
