import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class GoogleCSEScraper:
    async def scrape_topic(self, topic: str, max_results: int = 10) -> dict[str, Any]:
        api_key = get_platform_setting("google_cse_api_key")
        cx = get_platform_setting("google_cse_cx")
        if not api_key or not cx:
            raise ValueError("Google Custom Search API key or CX not configured")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                "https://www.googleapis.com/customsearch/v1",
                params={"key": api_key, "cx": cx, "q": topic, "num": min(max_results, 10)},
            )
            response.raise_for_status()
            data = response.json()

        items = data.get("items", [])
        snippets = [i.get("snippet", "") for i in items if i.get("snippet")]
        combined = "\n\n".join(snippets)

        logger.info("Google CSE: %d results for '%s'", len(items), topic)
        return {
            "source": "google_cse",
            "topic": topic,
            "results": len(items),
            "combined_text": combined[:8000],
        }
