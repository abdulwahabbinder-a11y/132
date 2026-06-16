"""Internet Archive (archive.org) search for archival photos / footage."""

from __future__ import annotations

from typing import Any

import httpx

ARCHIVE_SEARCH = "https://archive.org/advancedsearch.php"
ARCHIVE_METADATA = "https://archive.org/metadata"


async def fetch_internet_archive(
    query: str,
    *,
    mediatype: str = "image",
    limit: int = 6,
) -> list[dict[str, Any]]:
    """Return Internet Archive items matching the topic."""
    params = {
        "q": f'{query} AND mediatype:({mediatype})',
        "fl[]": ["identifier", "title", "date", "creator", "licenseurl"],
        "rows": limit,
        "page": 1,
        "output": "json",
        "sort[]": "downloads desc",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(ARCHIVE_SEARCH, params=params)
        if resp.status_code != 200:
            return []
        docs = resp.json().get("response", {}).get("docs", [])

        results: list[dict[str, Any]] = []
        for doc in docs:
            identifier = doc.get("identifier")
            if not identifier:
                continue
            meta_resp = await client.get(f"{ARCHIVE_METADATA}/{identifier}")
            if meta_resp.status_code != 200:
                continue
            meta = meta_resp.json()
            files = meta.get("files", [])
            best = _pick_best_file(files, mediatype)
            if not best:
                continue
            results.append(
                {
                    "source": "internet_archive",
                    "identifier": identifier,
                    "title": doc.get("title"),
                    "date": doc.get("date"),
                    "creator": doc.get("creator"),
                    "license": doc.get("licenseurl"),
                    "url": f"https://archive.org/download/{identifier}/{best['name']}",
                    "mime": best.get("format"),
                }
            )
    return results


def _pick_best_file(files: list[dict[str, Any]], mediatype: str) -> dict[str, Any] | None:
    targets = (
        ("JPEG", "PNG", "Animated GIF")
        if mediatype == "image"
        else ("MPEG4", "h.264", "h.264 IA", "Matroska")
    )
    for fmt in targets:
        for f in files:
            if f.get("format") == fmt:
                return f
    return None
