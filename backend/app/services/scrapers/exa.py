import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class ExaScraper:
    async def scrape_topic(self, topic: str, max_results: int = 8) -> dict[str, Any]:
        api_key = get_platform_setting("exa_api_key")
        if not api_key:
            raise ValueError("Exa API key not configured")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.exa.ai/search",
                headers={"x-api-key": api_key, "Content-Type": "application/json"},
                json={
                    "query": topic,
                    "numResults": max_results,
                    "contents": {"text": {"maxCharacters": 2000}},
                    "type": "auto",
                },
            )
            response.raise_for_status()
            data = response.json()

        results = data.get("results", [])
        texts = [r.get("text", "") for r in results if r.get("text")]
        combined = "\n\n".join(texts)

        logger.info("Exa: %d results for '%s'", len(results), topic)
        return {
            "source": "exa",
            "topic": topic,
            "results": len(results),
            "combined_text": combined[:12000],
        }
