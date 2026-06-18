import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class SerperScraper:
    async def scrape_topic(self, topic: str, max_results: int = 10) -> dict[str, Any]:
        api_key = get_platform_setting("serper_api_key")
        if not api_key:
            raise ValueError("Serper API key not configured")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                json={"q": topic, "num": max_results},
            )
            response.raise_for_status()
            data = response.json()

        organic = data.get("organic", [])
        snippets = [r.get("snippet", "") for r in organic if r.get("snippet")]
        combined = "\n\n".join(snippets)

        if data.get("answerBox", {}).get("answer"):
            combined = data["answerBox"]["answer"] + "\n\n" + combined

        logger.info("Serper: %d results for '%s'", len(organic), topic)
        return {
            "source": "serper",
            "topic": topic,
            "results": organic[:max_results],
            "combined_text": combined[:8000],
        }
