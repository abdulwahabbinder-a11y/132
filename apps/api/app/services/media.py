import base64
from pathlib import Path
from urllib.parse import quote

import aiofiles
import httpx

from app.core.config import get_settings
from app.schemas.story import DocumentaryScene

settings = get_settings()


class SceneMediaService:
    async def _download_binary(self, url: str, destination: Path, headers: dict | None = None) -> str:
        destination.parent.mkdir(parents=True, exist_ok=True)
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

        async with aiofiles.open(destination, "wb") as file_handle:
            await file_handle.write(response.content)
        return str(destination)

    async def fetch_wikimedia_asset(self, keyword: str, destination_dir: Path) -> dict | None:
        params = {
            "action": "query",
            "format": "json",
            "generator": "images",
            "prop": "imageinfo",
            "titles": keyword,
            "iiprop": "url",
        }
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(
                "https://commons.wikimedia.org/w/api.php",
                params=params,
            )
        response.raise_for_status()
        pages = response.json().get("query", {}).get("pages", {})
        first_page = next(iter(pages.values()), None)
        if not first_page:
            return None
        imageinfo = first_page.get("imageinfo", [])
        if not imageinfo:
            return None
        source_url = imageinfo[0].get("url")
        if not source_url:
            return None
        asset_path = await self._download_binary(
            source_url, destination_dir / f"wikimedia-{first_page['pageid']}.jpg"
        )
        return {"provider": "wikimedia", "source_url": source_url, "local_path": asset_path}

    async def fetch_internet_archive_asset(self, keyword: str, destination_dir: Path) -> dict | None:
        params = {
            "q": keyword,
            "fl[]": ["identifier", "title", "mediatype"],
            "rows": 1,
            "output": "json",
        }
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get("https://archive.org/advancedsearch.php", params=params)
        response.raise_for_status()
        docs = response.json().get("response", {}).get("docs", [])
        if not docs:
            return None
        doc = docs[0]
        identifier = doc["identifier"]
        metadata_url = f"https://archive.org/metadata/{identifier}"
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            metadata_response = await client.get(metadata_url)
        metadata_response.raise_for_status()
        files = metadata_response.json().get("files", [])
        downloadable = next(
            (
                file_entry
                for file_entry in files
                if file_entry.get("name", "").lower().endswith((".jpg", ".jpeg", ".png", ".mp4", ".webm"))
            ),
            None,
        )
        if downloadable is None:
            return None
        source_url = f"https://archive.org/download/{identifier}/{quote(downloadable['name'])}"
        asset_path = await self._download_binary(source_url, destination_dir / downloadable["name"])
        return {"provider": "internet-archive", "source_url": source_url, "local_path": asset_path}

    async def fetch_pexels_video(self, keyword: str, destination_dir: Path) -> dict | None:
        headers = {"Authorization": settings.pexels_api_key.get_secret_value()}
        params = {"query": keyword, "per_page": 1, "orientation": "landscape"}
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get("https://api.pexels.com/videos/search", params=params, headers=headers)
        response.raise_for_status()
        videos = response.json().get("videos", [])
        if not videos:
            return None
        file_info = next(
            (
                entry
                for entry in videos[0].get("video_files", [])
                if entry.get("quality") in {"hd", "sd"}
            ),
            None,
        )
        if file_info is None:
            return None
        asset_path = await self._download_binary(
            file_info["link"], destination_dir / f"pexels-{videos[0]['id']}.mp4"
        )
        return {"provider": "pexels", "source_url": file_info["link"], "local_path": asset_path}

    async def fetch_pixabay_video(self, keyword: str, destination_dir: Path) -> dict | None:
        params = {"key": settings.pixabay_api_key.get_secret_value(), "q": keyword, "per_page": 3}
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get("https://pixabay.com/api/videos/", params=params)
        response.raise_for_status()
        hits = response.json().get("hits", [])
        if not hits:
            return None
        medium_video = hits[0]["videos"].get("medium") or hits[0]["videos"].get("small")
        if not medium_video:
            return None
        asset_path = await self._download_binary(
            medium_video["url"], destination_dir / f"pixabay-{hits[0]['id']}.mp4"
        )
        return {"provider": "pixabay", "source_url": medium_video["url"], "local_path": asset_path}

    async def generate_flux_art(self, prompt: str, destination_dir: Path) -> dict:
        payload = {
            "model": "stabilityai/flux-1-dev",
            "prompt": prompt,
            "response_format": "b64_json",
            "size": "1536x864",
        }
        headers = {
            "Authorization": f"Bearer {settings.nvidia_nim_api_key.get_secret_value()}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{settings.nvidia_nim_base_url}/images/generations",
                json=payload,
                headers=headers,
            )
        response.raise_for_status()
        encoded = response.json()["data"][0]["b64_json"]
        image_path = destination_dir / "flux-scene.png"
        image_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(image_path, "wb") as file_handle:
            await file_handle.write(base64.b64decode(encoded))
        return {"provider": "flux", "local_path": str(image_path), "prompt": prompt}

    async def collect_assets_for_scene(self, scene: DocumentaryScene, topic: str, job_dir: Path) -> dict:
        scene_dir = job_dir / f"scene-{scene.scene_number:02d}"
        assets: dict[str, list | dict | None] = {
            "archival": [],
            "stock_video": [],
            "generated": None,
        }

        if scene.is_abstract_scene:
            assets["generated"] = await self.generate_flux_art(
                prompt=(
                    f"Photorealistic symbolic documentary scene about {topic}. "
                    f"Keywords: {', '.join(scene.visual_keywords)}. "
                    f"Moody, cinematic, high detail, volumetric light, 21:9 composition."
                ),
                destination_dir=scene_dir,
            )
        else:
            for keyword in [topic, *scene.visual_keywords[:2]]:
                wikimedia = await self.fetch_wikimedia_asset(keyword, scene_dir)
                if wikimedia:
                    assets["archival"].append(wikimedia)
                    break
            archive_asset = await self.fetch_internet_archive_asset(topic, scene_dir)
            if archive_asset:
                assets["archival"].append(archive_asset)

        for keyword in scene.visual_keywords[:2]:
            pexels_asset = await self.fetch_pexels_video(keyword, scene_dir)
            if pexels_asset:
                assets["stock_video"].append(pexels_asset)
            pixabay_asset = await self.fetch_pixabay_video(keyword, scene_dir)
            if pixabay_asset:
                assets["stock_video"].append(pixabay_asset)

        return assets
