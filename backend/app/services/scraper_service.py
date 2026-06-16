import httpx

from app.schemas.story import SceneSchema


class ScraperService:
    async def fetch_verifiable_facts(self, topic: str, scene: SceneSchema) -> dict:
        """Pull timeline hints from Wikipedia + Wikidata for fact anchoring."""
        wiki_summary = await self._fetch_wikipedia_extract(topic)
        wikidata_entities = await self._search_wikidata(topic)
        return {
            "wikipedia_summary": wiki_summary,
            "wikidata_entities": wikidata_entities,
            "scene_focus": scene.narration_text,
        }

    async def _fetch_wikipedia_extract(self, topic: str) -> dict:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "prop": "extracts",
            "explaintext": 1,
            "format": "json",
            "titles": topic,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.get(url, params=params)
            res.raise_for_status()
            return res.json()

    async def _search_wikidata(self, topic: str) -> dict:
        url = "https://www.wikidata.org/w/api.php"
        params = {"action": "wbsearchentities", "format": "json", "language": "en", "search": topic}
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.get(url, params=params)
            res.raise_for_status()
            return res.json()
