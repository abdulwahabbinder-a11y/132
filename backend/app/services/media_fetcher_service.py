import httpx

from app.core.config import get_settings
from app.schemas.story import SceneSchema
from app.services.nim_client import NIMClient

settings = get_settings()


class MediaFetcherService:
    def __init__(self, nim_client: NIMClient | None = None) -> None:
        self.nim = nim_client or NIMClient()

    async def fetch_scene_media(self, scene: SceneSchema) -> dict:
        stock = await self._fetch_stock_footage(scene.visual_keywords)
        archival = {}
        ai_art = {}
        if scene.is_abstract_scene:
            ai_art = await self.nim.generate_image_flux(
                prompt=f"Photorealistic cinematic documentary frame: {', '.join(scene.visual_keywords)}"
            )
        else:
            archival = await self._fetch_archival_media(scene.visual_keywords)
        return {"stock_footage": stock, "archival_media": archival, "abstract_art": ai_art}

    async def _fetch_archival_media(self, keywords: list[str]) -> dict:
        query = " ".join(keywords)
        wikimedia_url = "https://commons.wikimedia.org/w/api.php"
        wikimedia_params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json",
        }
        archive_url = "https://archive.org/advancedsearch.php"
        archive_params = {
            "q": query,
            "fl[]": ["identifier", "title"],
            "output": "json",
        }
        async with httpx.AsyncClient(timeout=45) as client:
            wiki_res, archive_res = await client.get(wikimedia_url, params=wikimedia_params), await client.get(
                archive_url, params=archive_params
            )
            wiki_res.raise_for_status()
            archive_res.raise_for_status()
            return {"wikimedia": wiki_res.json(), "internet_archive": archive_res.json()}

    async def _fetch_stock_footage(self, keywords: list[str]) -> dict:
        query = " ".join(keywords)
        headers = {"Authorization": settings.pexels_api_key} if settings.pexels_api_key else {}
        pexels_url = "https://api.pexels.com/videos/search"
        pixabay_url = "https://pixabay.com/api/videos/"
        async with httpx.AsyncClient(timeout=45) as client:
            pexels_task = client.get(pexels_url, params={"query": query, "per_page": 5}, headers=headers)
            pixabay_task = client.get(
                pixabay_url,
                params={"key": settings.pixabay_api_key, "q": query, "video_type": "film"},
            )
            pexels_res, pixabay_res = await pexels_task, await pixabay_task
            if pexels_res.status_code >= 400:
                pexels_payload = {"error": pexels_res.text}
            else:
                pexels_payload = pexels_res.json()
            if pixabay_res.status_code >= 400:
                pixabay_payload = {"error": pixabay_res.text}
            else:
                pixabay_payload = pixabay_res.json()
            return {"pexels": pexels_payload, "pixabay": pixabay_payload}
