import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)

TAVILY_API = "https://api.tavily.com/search"


class TavilyScraper:
    async def scrape_topic(self, topic: str, max_results: int = 8) -> dict[str, Any]:
        api_key = get_platform_setting("tavily_api_key")
        if not api_key:
            raise ValueError("Tavily API key not configured. Set it in Admin Dashboard.")

        payload = {
            "api_key": api_key,
            "query": topic,
            "search_depth": "advanced",
            "include_answer": True,
            "include_raw_content": False,
            "max_results": max_results,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(TAVILY_API, json=payload)
            response.raise_for_status()
            data = response.json()

        results = [
            {
                "title": r.get("title"),
                "url": r.get("url"),
                "content": r.get("content", "")[:800],
                "score": r.get("score"),
            }
            for r in data.get("results", [])
        ]

        combined_text = "\n\n".join(
            [data.get("answer", "")] + [r["content"] for r in results if r.get("content")]
        )

        logger.info("Tavily scraped %d results for '%s'", len(results), topic)
        return {
            "source": "tavily",
            "topic": topic,
            "answer": data.get("answer", ""),
            "results": results,
            "combined_text": combined_text[:12000],
        }
