"""Verifiable facts via the Wikipedia REST API and Wikidata SPARQL."""

from __future__ import annotations

from typing import Any, Dict, List

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

WIKI_REST = "https://en.wikipedia.org/api/rest_v1"
WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"


def _headers() -> Dict[str, str]:
    return {"User-Agent": settings.WIKIMEDIA_USER_AGENT, "Accept": "application/json"}


async def fetch_summary(topic: str) -> Dict[str, Any]:
    """Fetch the canonical lead summary for a topic."""
    async with httpx.AsyncClient(timeout=30) as client:
        # Resolve the best-matching page title first.
        search = await client.get(
            WIKI_API,
            headers=_headers(),
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
            return {}
        title = hits[0]["title"]

        summary = await client.get(
            f"{WIKI_REST}/page/summary/{title.replace(' ', '_')}",
            headers=_headers(),
        )
        if summary.status_code != 200:
            return {"title": title}
        data = summary.json()
        return {
            "title": data.get("title"),
            "extract": data.get("extract"),
            "wikidata_id": (data.get("wikibase_item")),
            "thumbnail": (data.get("thumbnail") or {}).get("source"),
            "content_url": (data.get("content_urls") or {}).get("desktop", {}).get("page"),
        }


async def fetch_timeline_facts(topic: str, limit: int = 12) -> List[Dict[str, Any]]:
    """Return chronologically-relevant facts.

    Strategy: pull the topic's Wikidata entity, then query for events that have
    a point-in-time (P585) / start (P580) qualifier related to it. Falls back to
    parsing date-bearing sentences from the article extract.
    """
    summary = await fetch_summary(topic)
    facts: List[Dict[str, Any]] = []

    wikidata_id = summary.get("wikidata_id")
    if wikidata_id:
        facts.extend(await _wikidata_events(wikidata_id, limit))

    if not facts and summary.get("extract"):
        facts.extend(_extract_dates_from_text(summary["extract"]))

    log.info("wikipedia.facts", topic=topic, count=len(facts))
    return facts[:limit]


async def _wikidata_events(entity_id: str, limit: int) -> List[Dict[str, Any]]:
    query = f"""
    SELECT ?eventLabel ?date WHERE {{
      wd:{entity_id} ?p ?event .
      ?event wdt:P585 ?date .
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} ORDER BY ?date LIMIT {limit}
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                WIKIDATA_SPARQL,
                headers=_headers(),
                params={"query": query, "format": "json"},
            )
            resp.raise_for_status()
            rows = resp.json().get("results", {}).get("bindings", [])
            return [
                {
                    "fact": r.get("eventLabel", {}).get("value"),
                    "date": r.get("date", {}).get("value"),
                    "source": "wikidata",
                }
                for r in rows
            ]
    except Exception as exc:  # noqa: BLE001
        log.warning("wikidata.failed", entity=entity_id, error=str(exc))
        return []


def _extract_dates_from_text(text: str) -> List[Dict[str, Any]]:
    import re

    facts: List[Dict[str, Any]] = []
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        m = re.search(r"\b(1\d{3}|20\d{2})\b", sentence)
        if m:
            facts.append({"fact": sentence.strip(), "date": m.group(1), "source": "wikipedia"})
    facts.sort(key=lambda f: f["date"])
    return facts
