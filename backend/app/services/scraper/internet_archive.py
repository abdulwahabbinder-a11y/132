"""Internet Archive (archive.org) media search."""

from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.logging import logger

_ADVANCED_SEARCH = "https://archive.org/advancedsearch.php"
_METADATA = "https://archive.org/metadata/{identifier}"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10), reraise=True)
async def search_media(query: str, *, media_type: str = "image", limit: int = 5) -> list[dict]:
    """Search archive.org for historical images or movies."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            _ADVANCED_SEARCH,
            params={
                "q": f'{query} AND mediatype:({media_type})',
                "fl[]": "identifier",
                "rows": limit,
                "page": 1,
                "output": "json",
            },
        )
        resp.raise_for_status()
        docs = resp.json().get("response", {}).get("docs", [])

        results: list[dict] = []
        for doc in docs:
            identifier = doc["identifier"]
            meta = await client.get(_METADATA.format(identifier=identifier))
            if meta.status_code != 200:
                continue
            payload = meta.json()
            files = payload.get("files", [])
            best = _pick_file(files, media_type)
            if not best:
                continue
            results.append(
                {
                    "source": "internet_archive",
                    "type": media_type,
                    "url": f"https://archive.org/download/{identifier}/{best['name']}",
                    "identifier": identifier,
                    "license": payload.get("metadata", {}).get("licenseurl"),
                    "title": payload.get("metadata", {}).get("title"),
                }
            )
    logger.debug("Internet Archive returned {} items for '{}'", len(results), query)
    return results


def _pick_file(files: list[dict], media_type: str) -> dict | None:
    wanted = (
        (".jpg", ".jpeg", ".png")
        if media_type == "image"
        else (".mp4", ".webm", ".ogv")
    )
    for f in files:
        name = (f.get("name") or "").lower()
        if name.endswith(wanted):
            return f
    return None
