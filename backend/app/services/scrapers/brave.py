import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class BraveScraper:
    async def scrape_topic(self, topic: str, max_results: int = 10) -> dict[str, Any]:
        api_key = get_platform_setting("brave_search_api_key")
        if not api_key:
            raise ValueError("Brave Search API key not configured")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers={"Accept": "application/json", "X-Subscription-Token": api_key},
                params={"q": topic, "count": max_results},
            )
            response.raise_for_status()
            data = response.json()

        web_results = data.get("web", {}).get("results", [])
        snippets = [r.get("description", "") for r in web_results if r.get("description")]
        combined = "\n\n".join(snippets)

        logger.info("Brave: %d results for '%s'", len(web_results), topic)
        return {
            "source": "brave",
            "topic": topic,
            "results": web_results[:max_results],
            "combined_text": combined[:8000],
        }
