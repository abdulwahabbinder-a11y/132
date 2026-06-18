import logging
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

IA_SEARCH_API = "https://archive.org/advancedsearch.php"
IA_METADATA_API = "https://archive.org/metadata"


class InternetArchiveScraper:
    async def search_archival_media(
        self,
        keywords: list[str],
        output_dir: Path | None = None,
    ) -> list[dict[str, Any]]:
        query = " AND ".join(keywords[:3])
        assets: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            search_resp = await client.get(
                IA_SEARCH_API,
                params={
                    "q": f"({query}) AND mediatype:(movies OR image)",
                    "fl[]": ["identifier", "title", "description"],
                    "rows": 5,
                    "page": 1,
                    "output": "json",
                },
            )
            search_resp.raise_for_status()
            docs = search_resp.json().get("response", {}).get("docs", [])

            for doc in docs[:3]:
                identifier = doc.get("identifier")
                if not identifier:
                    continue

                meta_resp = await client.get(f"{IA_METADATA_API}/{identifier}")
                if meta_resp.status_code != 200:
                    continue

                meta = meta_resp.json()
                files = meta.get("files", [])
                image_files = [
                    f
                    for f in files
                    if f.get("name", "").lower().endswith((".jpg", ".jpeg", ".png", ".gif"))
                ]

                for img_file in image_files[:1]:
                    file_url = f"https://archive.org/download/{identifier}/{img_file['name']}"
                    local_path = None
                    if output_dir:
                        output_dir.mkdir(parents=True, exist_ok=True)
                        local_path = output_dir / f"ia_{identifier}_{img_file['name']}"
                        img_resp = await client.get(file_url)
                        if img_resp.status_code == 200:
                            local_path.write_bytes(img_resp.content)

                    assets.append(
                        {
                            "source": "internet_archive",
                            "identifier": identifier,
                            "title": doc.get("title"),
                            "url": file_url,
                            "local_path": str(local_path) if local_path else None,
                        }
                    )

        logger.info("Fetched %d Internet Archive assets", len(assets))
        return assets
