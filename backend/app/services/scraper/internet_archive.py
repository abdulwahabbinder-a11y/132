"""Archival media from the Internet Archive (archive.org)."""

from __future__ import annotations

from typing import Dict, List

import httpx

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)

IA_ADVANCED_SEARCH = "https://archive.org/advancedsearch.php"
IA_METADATA = "https://archive.org/metadata"


def _headers() -> Dict[str, str]:
    return {"User-Agent": settings.WIKIMEDIA_USER_AGENT, "Accept": "application/json"}


async def search_media(query: str, limit: int = 5, mediatype: str = "image") -> List[Dict[str, str]]:
    """Search archive.org for public-domain images / movies for a query."""
    async with httpx.AsyncClient(timeout=40) as client:
        resp = await client.get(
            IA_ADVANCED_SEARCH,
            headers=_headers(),
            params={
                "q": f'{query} AND mediatype:{mediatype}',
                "fl[]": ["identifier", "title", "licenseurl"],
                "rows": limit,
                "output": "json",
            },
        )
        resp.raise_for_status()
        docs = resp.json().get("response", {}).get("docs", [])

        results: List[Dict[str, str]] = []
        for doc in docs:
            identifier = doc.get("identifier")
            if not identifier:
                continue
            file_url = await _first_file_url(client, identifier, mediatype)
            if file_url:
                results.append(
                    {
                        "url": file_url,
                        "source_url": f"https://archive.org/details/{identifier}",
                        "title": doc.get("title", ""),
                        "license": doc.get("licenseurl", "public-domain"),
                        "provider": "internet_archive",
                    }
                )
    log.info("internet_archive.search", query=query, count=len(results))
    return results


async def _first_file_url(client: httpx.AsyncClient, identifier: str, mediatype: str) -> str | None:
    exts = {"image": (".jpg", ".jpeg", ".png"), "movies": (".mp4", ".ogv", ".webm")}.get(
        mediatype, (".jpg",)
    )
    try:
        meta = await client.get(f"{IA_METADATA}/{identifier}", headers=_headers())
        meta.raise_for_status()
        data = meta.json()
        server = data.get("server")
        d = data.get("dir")
        for f in data.get("files", []):
            name = f.get("name", "")
            if name.lower().endswith(exts) and server and d:
                return f"https://{server}{d}/{name}"
    except Exception as exc:  # noqa: BLE001
        log.warning("internet_archive.metadata_failed", identifier=identifier, error=str(exc))
    return None
