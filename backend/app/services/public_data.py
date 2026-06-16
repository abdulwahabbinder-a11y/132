from __future__ import annotations

import asyncio
from pathlib import Path
from urllib.parse import quote, quote_plus, urlparse

import aiofiles
import httpx

from app.core.config import Settings
from app.schemas import MediaAsset, StoryScene, TimelineFact
from app.services.nim_client import NimClient


class PublicDataMediaFetcher:
    """Fetches verifiable facts and multi-source scene media from public APIs."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.headers = {"User-Agent": settings.wikimedia_user_agent}

    async def fetch_timeline_facts(self, topic: str) -> list[TimelineFact]:
        wikipedia, wikidata = await asyncio.gather(
            self._fetch_wikipedia_summary(topic),
            self._fetch_wikidata_entities(topic),
            return_exceptions=True,
        )
        facts: list[TimelineFact] = []
        if isinstance(wikipedia, TimelineFact):
            facts.append(wikipedia)
        if isinstance(wikidata, list):
            facts.extend(wikidata[:5])
        return facts

    async def fetch_scene_assets(self, scene: StoryScene, generation_dir: Path, nim: NimClient) -> list[MediaAsset]:
        query = " ".join(scene.visual_keywords)
        tasks = [
            self._search_pexels(scene.scene_number, query),
            self._search_pixabay(scene.scene_number, query),
        ]
        if scene.is_abstract_scene:
            tasks.append(self._generate_flux_asset(scene, generation_dir, nim))
        else:
            tasks.extend(
                [
                    self._search_wikimedia(scene.scene_number, query),
                    self._search_internet_archive(scene.scene_number, query),
                ]
            )

        results = await asyncio.gather(*tasks, return_exceptions=True)
        assets: list[MediaAsset] = []
        for result in results:
            if isinstance(result, list):
                assets.extend(result)
            elif isinstance(result, MediaAsset):
                assets.append(result)
        return await self.download_scene_assets(assets, generation_dir)

    async def download_scene_assets(self, assets: list[MediaAsset], output_dir: Path) -> list[MediaAsset]:
        """Download a bounded representative set for deterministic rendering."""

        downloadable = [
            asset
            for asset in assets
            if asset.url and asset.provider != "internet_archive" and not asset.local_path
        ]
        images = [asset for asset in downloadable if asset.asset_type == "image"][:2]
        videos = [asset for asset in downloadable if asset.asset_type == "video"][:2]
        selected = images + videos
        downloaded = await asyncio.gather(
            *[self._download_asset(asset, output_dir, index) for index, asset in enumerate(selected, start=1)],
            return_exceptions=True,
        )
        by_url = {asset.url: asset for asset in downloaded if isinstance(asset, MediaAsset)}
        return [by_url.get(asset.url, asset) for asset in assets]

    async def _download_asset(self, asset: MediaAsset, output_dir: Path, index: int) -> MediaAsset:
        if not asset.url:
            return asset

        suffix = Path(urlparse(asset.url).path).suffix
        if not suffix:
            suffix = ".mp4" if asset.asset_type == "video" else ".jpg"
        output_path = output_dir / f"scene-{asset.scene_number:03d}-{asset.provider}-{index}{suffix}"
        max_bytes = 220 * 1024 * 1024
        bytes_written = 0

        async with httpx.AsyncClient(timeout=120, follow_redirects=True, headers=self.headers) as client:
            async with client.stream("GET", asset.url) as response:
                response.raise_for_status()
                async with aiofiles.open(output_path, "wb") as file:
                    async for chunk in response.aiter_bytes():
                        bytes_written += len(chunk)
                        if bytes_written > max_bytes:
                            raise ValueError(f"Asset exceeded maximum download size: {asset.url}")
                        await file.write(chunk)

        return asset.model_copy(update={"local_path": str(output_path)})

    async def _fetch_wikipedia_summary(self, topic: str) -> TimelineFact | None:
        title = quote_plus(topic)
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
        async with httpx.AsyncClient(timeout=20, headers=self.headers) as client:
            response = await client.get(url)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        payload = response.json()
        return TimelineFact(
            title=payload.get("title", topic),
            source_url=payload.get("content_urls", {}).get("desktop", {}).get("page", url),
            summary=payload.get("extract", ""),
            timestamp=None,
        )

    async def _fetch_wikidata_entities(self, topic: str) -> list[TimelineFact]:
        params = {
            "action": "wbsearchentities",
            "search": topic,
            "language": "en",
            "format": "json",
            "limit": 5,
        }
        async with httpx.AsyncClient(timeout=20, headers=self.headers) as client:
            response = await client.get("https://www.wikidata.org/w/api.php", params=params)
        response.raise_for_status()
        facts = []
        for item in response.json().get("search", []):
            entity_id = item.get("id")
            facts.append(
                TimelineFact(
                    title=item.get("label", topic),
                    source_url=f"https://www.wikidata.org/wiki/{entity_id}" if entity_id else "https://www.wikidata.org",
                    summary=item.get("description", "Wikidata entity match"),
                    timestamp=None,
                )
            )
        return facts

    async def _search_wikimedia(self, scene_number: int, query: str) -> list[MediaAsset]:
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": f"file:{query}",
            "gsrlimit": 5,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "format": "json",
        }
        async with httpx.AsyncClient(timeout=30, headers=self.headers) as client:
            response = await client.get("https://commons.wikimedia.org/w/api.php", params=params)
        response.raise_for_status()
        pages = response.json().get("query", {}).get("pages", {})
        assets = []
        for page in pages.values():
            image_info = (page.get("imageinfo") or [{}])[0]
            url = image_info.get("url")
            if not url:
                continue
            metadata = image_info.get("extmetadata", {})
            assets.append(
                MediaAsset(
                    scene_number=scene_number,
                    provider="wikimedia",
                    asset_type="image",
                    url=url,
                    attribution=metadata.get("Artist", {}).get("value") or page.get("title"),
                    metadata={"title": page.get("title"), "license": metadata.get("LicenseShortName", {}).get("value")},
                )
            )
        return assets

    async def _search_internet_archive(self, scene_number: int, query: str) -> list[MediaAsset]:
        params = {
            "q": f'({query}) AND mediatype:(movies OR image)',
            "fl[]": ["identifier", "title", "mediatype"],
            "rows": 5,
            "page": 1,
            "output": "json",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(self.settings.internet_archive_base_url, params=params)
        response.raise_for_status()
        docs = response.json().get("response", {}).get("docs", [])
        resolved = await asyncio.gather(
            *[self._resolve_internet_archive_asset(scene_number, doc) for doc in docs if doc.get("identifier")],
            return_exceptions=True,
        )
        return [asset for asset in resolved if isinstance(asset, MediaAsset)]

    async def _resolve_internet_archive_asset(self, scene_number: int, doc: dict) -> MediaAsset | None:
        identifier = doc.get("identifier")
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(f"https://archive.org/metadata/{identifier}")
        response.raise_for_status()
        files = response.json().get("files", [])
        preferred = next(
            (
                item
                for item in files
                if str(item.get("name", "")).lower().endswith((".mp4", ".jpg", ".jpeg", ".png"))
            ),
            None,
        )
        if not preferred:
            return None
        name = preferred["name"]
        asset_type = "video" if name.lower().endswith(".mp4") else "image"
        return MediaAsset(
            scene_number=scene_number,
            provider="internet_archive",
            asset_type=asset_type,
            url=f"https://archive.org/download/{identifier}/{quote(name)}",
            attribution=doc.get("title"),
            metadata={**doc, "file": preferred, "page_url": f"https://archive.org/details/{identifier}"},
        )

    async def _search_pexels(self, scene_number: int, query: str) -> list[MediaAsset]:
        if not self.settings.pexels_api_key:
            return []
        async with httpx.AsyncClient(timeout=30, headers={"Authorization": self.settings.pexels_api_key}) as client:
            response = await client.get("https://api.pexels.com/videos/search", params={"query": query, "per_page": 5})
        response.raise_for_status()
        assets = []
        for video in response.json().get("videos", []):
            files = video.get("video_files", [])
            hd_file = next((item for item in files if item.get("quality") == "hd"), files[0] if files else {})
            if hd_file.get("link"):
                assets.append(
                    MediaAsset(
                        scene_number=scene_number,
                        provider="pexels",
                        asset_type="video",
                        url=hd_file["link"],
                        attribution=video.get("user", {}).get("name"),
                        metadata={"pexels_id": video.get("id"), "page_url": video.get("url")},
                    )
                )
        return assets

    async def _search_pixabay(self, scene_number: int, query: str) -> list[MediaAsset]:
        if not self.settings.pixabay_api_key:
            return []
        params = {"key": self.settings.pixabay_api_key, "q": query, "video_type": "film", "per_page": 5}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get("https://pixabay.com/api/videos/", params=params)
        response.raise_for_status()
        assets = []
        for item in response.json().get("hits", []):
            video = item.get("videos", {}).get("large") or item.get("videos", {}).get("medium")
            if video and video.get("url"):
                assets.append(
                    MediaAsset(
                        scene_number=scene_number,
                        provider="pixabay",
                        asset_type="video",
                        url=video["url"],
                        attribution=item.get("user"),
                        metadata={"pixabay_id": item.get("id"), "page_url": item.get("pageURL")},
                    )
                )
        return assets

    async def _generate_flux_asset(self, scene: StoryScene, generation_dir: Path, nim: NimClient) -> MediaAsset:
        output_path = generation_dir / f"scene-{scene.scene_number:03d}-flux.png"
        prompt = (
            "Photorealistic cinematic documentary image, 21:9 frame, atmospheric lighting, "
            f"historically grounded abstract visualization of: {scene.narration_text}. "
            f"Visual keywords: {', '.join(scene.visual_keywords)}."
        )
        response = await nim.generate_flux_image(prompt=prompt, output_path=str(output_path))
        return MediaAsset(
            scene_number=scene.scene_number,
            provider="flux",
            asset_type="image",
            local_path=str(output_path),
            metadata=response,
        )
