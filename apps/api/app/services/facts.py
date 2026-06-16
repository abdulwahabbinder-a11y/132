from urllib.parse import quote

import httpx

from app.core.config import get_settings
from app.schemas.story import DocumentaryScene

settings = get_settings()


class HistoricalFactService:
    async def fetch_wikipedia_summary(self, topic: str) -> dict:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(topic)}"
            )
        response.raise_for_status()
        return response.json()

    async def fetch_wikidata_timeline(self, topic: str) -> dict:
        params = {
            "action": "wbsearchentities",
            "search": topic,
            "language": "en",
            "format": "json",
        }
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            search_response = await client.get("https://www.wikidata.org/w/api.php", params=params)
        search_response.raise_for_status()
        search_json = search_response.json()
        return search_json["search"][0] if search_json.get("search") else {}

    async def enrich_scene(self, scene: DocumentaryScene, topic: str) -> dict:
        summary, wikidata = await self.fetch_wikipedia_summary(topic), await self.fetch_wikidata_timeline(
            topic
        )
        return {
            "scene_number": scene.scene_number,
            "topic_summary": summary.get("extract"),
            "wikidata_entity": wikidata.get("id"),
            "wikidata_label": wikidata.get("label"),
            "thumbnail": summary.get("thumbnail", {}).get("source"),
        }
