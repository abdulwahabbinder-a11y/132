"""Internet Archive (archive.org) advanced-search client.

Used for archival photos and short film clips when the scene is historical and
not abstract.
"""

from __future__ import annotations

from typing import List

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

IA_ADVANCED = "https://archive.org/advancedsearch.php"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=1, max=10))
async def search(query: str, *, media_type: str = "image", limit: int = 6) -> List[dict]:
    """Return public-domain assets matching `query`.

    `media_type` is one of `image`, `movies`, `audio`.
    """
    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "DocuGen/1.0"}) as c:
        r = await c.get(
            IA_ADVANCED,
            params={
                "q": f'{query} AND mediatype:({media_type}) AND publicdate:[* TO *]',
                "fl[]": ["identifier", "title", "creator", "mediatype"],
                "rows": limit,
                "page": 1,
                "output": "json",
            },
        )
        r.raise_for_status()
        docs = r.json().get("response", {}).get("docs", [])

    out: list[dict] = []
    for d in docs:
        ident = d.get("identifier")
        if not ident:
            continue
        # Convention: archive.org details page; the worker can resolve
        # a downloadable derivative file via the /metadata/{id} endpoint.
        out.append(
            {
                "url": f"https://archive.org/details/{ident}",
                "kind": "image" if media_type == "image" else "video",
                "credit": d.get("creator") or "Internet Archive",
                "license": "Public Domain / archive.org",
                "source": "internet_archive",
                "identifier": ident,
            }
        )
    return out
