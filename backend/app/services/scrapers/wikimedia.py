import logging
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

COMMONS_API = "https://commons.wikimedia.org/w/api.php"


class WikimediaScraper:
    async def search_archival_photos(
        self,
        keywords: list[str],
        character_name: str | None = None,
        output_dir: Path | None = None,
    ) -> list[dict[str, Any]]:
        query = character_name or " ".join(keywords[:3])
        assets: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            search_resp = await client.get(
                COMMONS_API,
                params={
                    "action": "query",
                    "generator": "search",
                    "gsrsearch": f'filetype:bitmap {query}',
                    "gsrlimit": 5,
                    "prop": "imageinfo",
                    "iiprop": "url|size|mime|extmetadata",
                    "iiurlwidth": 1920,
                    "format": "json",
                },
            )
            search_resp.raise_for_status()
            pages = search_resp.json().get("query", {}).get("pages", {})

            for page_id, page in pages.items():
                if page_id == "-1":
                    continue
                imageinfo = page.get("imageinfo", [{}])[0]
                url = imageinfo.get("thumburl") or imageinfo.get("url")
                if not url:
                    continue

                local_path = None
                if output_dir:
                    output_dir.mkdir(parents=True, exist_ok=True)
                    ext = Path(url).suffix.split("?")[0] or ".jpg"
                    local_path = output_dir / f"wikimedia_{page_id}{ext}"
                    img_resp = await client.get(url)
                    img_resp.raise_for_status()
                    local_path.write_bytes(img_resp.content)

                assets.append(
                    {
                        "source": "wikimedia_commons",
                        "title": page.get("title"),
                        "url": url,
                        "local_path": str(local_path) if local_path else None,
                        "width": imageinfo.get("width"),
                        "height": imageinfo.get("height"),
                    }
                )

        logger.info("Fetched %d Wikimedia assets for '%s'", len(assets), query)
        return assets
