from typing import Any
from urllib.parse import quote_plus

import httpx

from app.core.config import Settings
from app.schemas.story import StoryScene


class PublicMediaFetcher:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def fetch_scene_assets(self, topic: str, scene: StoryScene) -> dict[str, Any]:
        keywords = " ".join(scene.visual_keywords) or topic
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            facts = await self.fetch_verifiable_facts(client, topic, scene)
            commons = [] if scene.is_abstract_scene else await self.fetch_wikimedia(client, keywords)
            archive = [] if scene.is_abstract_scene else await self.fetch_internet_archive(client, keywords)
            pexels = await self.fetch_pexels(client, keywords)
            pixabay = await self.fetch_pixabay(client, keywords)
        return {
            "scene_number": scene.scene_number,
            "facts": facts,
            "archival_photos": commons,
            "internet_archive": archive,
            "stock_footage": {
                "pexels": pexels,
                "pixabay": pixabay,
            },
        }

    async def fetch_verifiable_facts(
        self,
        client: httpx.AsyncClient,
        topic: str,
        scene: StoryScene,
    ) -> dict[str, Any]:
        wikipedia_params = {
            "action": "query",
            "format": "json",
            "prop": "extracts",
            "exintro": True,
            "explaintext": True,
            "titles": topic,
        }
        wikidata_query = f"""
        SELECT ?event ?eventLabel ?date WHERE {{
          ?event rdfs:label ?eventLabel.
          FILTER(LANG(?eventLabel) = "en")
          FILTER(CONTAINS(LCASE(?eventLabel), "{topic.lower()}"))
          OPTIONAL {{ ?event wdt:P585 ?date. }}
        }}
        LIMIT 10
        """
        wikipedia_response = await client.get(
            str(self.settings.wikipedia_api_base_url),
            params=wikipedia_params,
        )
        wikidata_response = await client.get(
            str(self.settings.wikidata_sparql_url),
            params={"format": "json", "query": wikidata_query},
            headers={"Accept": "application/sparql-results+json"},
        )
        return {
            "wikipedia": self._safe_json(wikipedia_response),
            "wikidata": self._safe_json(wikidata_response),
            "scene_hint": scene.narration_text[:240],
        }

    async def fetch_wikimedia(self, client: httpx.AsyncClient, query: str) -> list[dict[str, Any]]:
        response = await client.get(
            str(self.settings.wikimedia_api_base_url),
            params={
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": query,
                "gsrnamespace": 6,
                "gsrlimit": 8,
                "prop": "imageinfo",
                "iiprop": "url|mime|extmetadata",
            },
        )
        pages = self._safe_json(response).get("query", {}).get("pages", {})
        return [
            {
                "title": page.get("title"),
                "url": page.get("imageinfo", [{}])[0].get("url"),
                "mime": page.get("imageinfo", [{}])[0].get("mime"),
            }
            for page in pages.values()
            if page.get("imageinfo")
        ]

    async def fetch_internet_archive(self, client: httpx.AsyncClient, query: str) -> list[dict[str, Any]]:
        response = await client.get(
            str(self.settings.internet_archive_base_url),
            params={
                "q": f"title:({quote_plus(query)}) OR description:({quote_plus(query)})",
                "fl[]": ["identifier", "title", "mediatype"],
                "rows": 8,
                "output": "json",
            },
        )
        docs = self._safe_json(response).get("response", {}).get("docs", [])
        return [
            {
                "identifier": item.get("identifier"),
                "title": item.get("title"),
                "mediatype": item.get("mediatype"),
                "details_url": f"https://archive.org/details/{item.get('identifier')}",
            }
            for item in docs
        ]

    async def fetch_pexels(self, client: httpx.AsyncClient, query: str) -> list[dict[str, Any]]:
        if not self.settings.pexels_api_key:
            return []
        response = await client.get(
            "https://api.pexels.com/videos/search",
            headers={"Authorization": self.settings.pexels_api_key},
            params={"query": query, "per_page": 5, "orientation": "landscape"},
        )
        videos = self._safe_json(response).get("videos", [])
        return [
            {
                "id": item.get("id"),
                "url": item.get("url"),
                "duration": item.get("duration"),
                "files": item.get("video_files", [])[:3],
            }
            for item in videos
        ]

    async def fetch_pixabay(self, client: httpx.AsyncClient, query: str) -> list[dict[str, Any]]:
        if not self.settings.pixabay_api_key:
            return []
        response = await client.get(
            "https://pixabay.com/api/videos/",
            params={"key": self.settings.pixabay_api_key, "q": query, "per_page": 5},
        )
        hits = self._safe_json(response).get("hits", [])
        return [
            {
                "id": item.get("id"),
                "page_url": item.get("pageURL"),
                "duration": item.get("duration"),
                "videos": item.get("videos", {}),
            }
            for item in hits
        ]

    @staticmethod
    def best_visual_asset(scene_assets: dict[str, Any]) -> str | None:
        archival = scene_assets.get("archival_photos", [])
        if archival:
            return archival[0].get("url")
        pexels = scene_assets.get("stock_footage", {}).get("pexels", [])
        if pexels:
            files = pexels[0].get("files") or []
            if files:
                return files[0].get("link")
        pixabay = scene_assets.get("stock_footage", {}).get("pixabay", [])
        if pixabay:
            videos = pixabay[0].get("videos") or {}
            large = videos.get("large") or videos.get("medium") or videos.get("small")
            if large:
                return large.get("url")
        return None

    @staticmethod
    def _safe_json(response: httpx.Response) -> dict[str, Any]:
        if response.status_code >= 400:
            return {"error": response.text, "status_code": response.status_code}
        return response.json()
