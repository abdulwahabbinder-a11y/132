"""Wikipedia + Wikidata fact + timeline extractor."""

from __future__ import annotations

from typing import Any

import httpx

WIKI_REST = "https://en.wikipedia.org/api/rest_v1"
WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"


async def fetch_wikipedia_facts(topic: str, *, language: str = "en") -> dict[str, Any]:
    """Return a structured summary + key dates for a topic."""
    rest_base = f"https://{language}.wikipedia.org/api/rest_v1"
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        summary_resp = await client.get(f"{rest_base}/page/summary/{topic.replace(' ', '_')}")
        if summary_resp.status_code != 200:
            return {"topic": topic, "summary": None, "facts": [], "url": None}

        summary = summary_resp.json()
        page_title = summary.get("title", topic)

        timeline_resp = await client.get(
            WIKI_API,
            params={
                "action": "query",
                "prop": "revisions",
                "titles": page_title,
                "rvprop": "content",
                "rvslots": "main",
                "format": "json",
                "redirects": 1,
            },
        )
        facts: list[str] = []
        if timeline_resp.status_code == 200:
            data = timeline_resp.json()
            pages = data.get("query", {}).get("pages", {})
            for _, page in pages.items():
                for rev in page.get("revisions", []):
                    content = rev.get("slots", {}).get("main", {}).get("*", "")
                    facts.extend(_extract_date_lines(content))
                    break

    return {
        "topic": topic,
        "title": page_title,
        "summary": summary.get("extract"),
        "url": summary.get("content_urls", {}).get("desktop", {}).get("page"),
        "thumbnail": summary.get("thumbnail", {}).get("source"),
        "facts": facts[:40],
    }


def _extract_date_lines(wikitext: str) -> list[str]:
    """Pluck lines containing 4-digit years from wikitext (cheap heuristic)."""
    import re

    year_pattern = re.compile(r"\b(1[0-9]{3}|20[0-9]{2})\b")
    out: list[str] = []
    for raw_line in wikitext.splitlines():
        line = raw_line.strip()
        if not line or line.startswith(("{{", "|", "[[Category", "==")):
            continue
        if year_pattern.search(line) and len(line) < 400:
            cleaned = re.sub(r"\[\[([^|\]]+\|)?([^\]]+)\]\]", r"\2", line)
            cleaned = re.sub(r"<[^>]+>", "", cleaned)
            cleaned = re.sub(r"'''?", "", cleaned)
            out.append(cleaned)
    return out
