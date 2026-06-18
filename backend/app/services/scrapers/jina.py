import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)

JINA_SEARCH_API = "https://s.jina.ai"
JINA_READER_API = "https://r.jina.ai"


class JinaScraper:
    async def scrape_topic(self, topic: str, max_urls: int = 5) -> dict[str, Any]:
        api_key = get_platform_setting("jina_api_key")
        if not api_key:
            raise ValueError("Jina AI API key not configured. Set it in Admin Dashboard.")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "X-Respond-With": "no-content",
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            search_resp = await client.get(
                f"{JINA_SEARCH_API}/{topic}",
                headers=headers,
            )
            search_resp.raise_for_status()
            search_data = search_resp.json()

            urls: list[str] = []
            if isinstance(search_data, dict):
                for item in search_data.get("data", [])[:max_urls]:
                    if isinstance(item, dict) and item.get("url"):
                        urls.append(item["url"])
            elif isinstance(search_data, list):
                for item in search_data[:max_urls]:
                    if isinstance(item, dict) and item.get("url"):
                        urls.append(item["url"])

            reader_results: list[dict[str, Any]] = []
            for url in urls[:max_urls]:
                try:
                    reader_resp = await client.get(
                        f"{JINA_READER_API}/{url}",
                        headers={**headers, "X-Return-Format": "markdown"},
                    )
                    if reader_resp.status_code == 200:
                        content = reader_resp.text[:4000]
                        reader_results.append({"url": url, "content": content})
                except Exception as exc:
                    logger.warning("Jina reader failed for %s: %s", url, exc)

        combined_text = "\n\n".join(r["content"] for r in reader_results if r.get("content"))

        logger.info("Jina scraped %d pages for '%s'", len(reader_results), topic)
        return {
            "source": "jina",
            "topic": topic,
            "urls": urls,
            "pages": reader_results,
            "combined_text": combined_text[:12000],
        }
