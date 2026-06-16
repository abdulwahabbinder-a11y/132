import logging
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class NewsAPIScraper:
    async def scrape_topic(self, topic: str, max_results: int = 10) -> dict[str, Any]:
        api_key = get_platform_setting("newsapi_key")
        if not api_key:
            raise ValueError("NewsAPI key not configured")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": topic,
                    "sortBy": "relevancy",
                    "pageSize": max_results,
                    "apiKey": api_key,
                    "language": "en",
                },
            )
            response.raise_for_status()
            data = response.json()

        articles = data.get("articles", [])
        texts = []
        for a in articles:
            parts = [a.get("title", ""), a.get("description", ""), a.get("content", "")[:500]]
            texts.append(" — ".join(p for p in parts if p))

        combined = "\n\n".join(texts)
        logger.info("NewsAPI: %d articles for '%s'", len(articles), topic)
        return {
            "source": "newsapi",
            "topic": topic,
            "articles": len(articles),
            "combined_text": combined[:10000],
        }
