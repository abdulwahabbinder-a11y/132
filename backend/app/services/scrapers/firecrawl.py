import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class FirecrawlScraper:
    async def scrape_topic(self, topic: str, max_results: int = 8) -> dict[str, Any]:
        api_key = get_platform_setting("firecrawl_api_key")
        if not api_key:
            raise ValueError("Firecrawl API key not configured")

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                "https://api.firecrawl.dev/v1/search",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"query": topic, "limit": max_results, "scrapeOptions": {"formats": ["markdown"]}},
            )
            response.raise_for_status()
            data = response.json()

        items = data.get("data", [])
        texts = []
        for item in items:
            md = item.get("markdown") or item.get("description") or ""
            if md:
                texts.append(md[:2000])

        combined = "\n\n".join(texts)
        logger.info("Firecrawl: %d pages for '%s'", len(items), topic)
        return {
            "source": "firecrawl",
            "topic": topic,
            "pages": len(items),
            "combined_text": combined[:12000],
        }
