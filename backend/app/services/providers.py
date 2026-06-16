from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.parse import quote
from uuid import uuid4

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import Settings


class ProviderError(RuntimeError):
    """Raised when an upstream provider fails."""


class ProviderClients:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.storage_root = settings.storage_path
        self.storage_root.mkdir(parents=True, exist_ok=True)

    def _headers(self) -> dict[str, str]:
        if not self.settings.nvidia_nim_api_key:
            raise ProviderError("NVIDIA_NIM_API_KEY is not configured.")
        return {
            "Authorization": f"Bearer {self.settings.nvidia_nim_api_key}",
            "Content-Type": "application/json",
        }

    @retry(wait=wait_exponential(min=1, max=8), stop=stop_after_attempt(3), reraise=True)
    async def chat_completion(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        response_format: dict[str, Any] | None = None,
    ) -> str:
        payload: dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }
        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                f"{self.settings.nvidia_nim_base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        return data["choices"][0]["message"]["content"]

    async def generate_flux_image(self, prompt: str, project_dir: Path, scene_number: int) -> dict[str, Any]:
        payload = {
            "model": "stabilityai/flux-1-dev",
            "prompt": prompt,
            "size": "1536x864",
        }
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{self.settings.nvidia_nim_base_url}/images/generations",
                headers=self._headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        output_path = project_dir / f"scene-{scene_number:02d}-flux.json"
        output_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return {"provider": "nvidia-flux", "manifest_path": str(output_path), "raw": data}

    async def fetch_wikipedia_facts(self, topic: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30, headers={"User-Agent": self.settings.wikimedia_user_agent}) as client:
            search_response = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "format": "json",
                    "list": "search",
                    "srsearch": topic,
                    "srlimit": 1,
                },
            )
            search_response.raise_for_status()
            search_data = search_response.json()
            search_results = search_data.get("query", {}).get("search", [])
            if not search_results:
                return {"topic": topic, "facts": [], "page_title": None}

            page_title = search_results[0]["title"]
            extract_response = await client.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(page_title, safe='')}",
            )
            extract_response.raise_for_status()
            extract_data = extract_response.json()

            wikidata_id = extract_data.get("wikibase_item")
            timeline_facts: list[dict[str, Any]] = []
            if wikidata_id:
                timeline_facts = await self.fetch_wikidata_timeline(client, wikidata_id)

        return {
            "topic": topic,
            "page_title": page_title,
            "summary": extract_data.get("extract"),
            "timeline_facts": timeline_facts,
            "source_url": extract_data.get("content_urls", {}).get("desktop", {}).get("page"),
        }

    async def fetch_wikidata_timeline(self, client: httpx.AsyncClient, wikidata_id: str) -> list[dict[str, Any]]:
        response = await client.get(f"https://www.wikidata.org/wiki/Special:EntityData/{wikidata_id}.json")
        response.raise_for_status()
        entity = response.json()["entities"][wikidata_id]
        claims = entity.get("claims", {})
        timeline: list[dict[str, Any]] = []
        for property_id in ("P569", "P570", "P580", "P582", "P571", "P576"):
            for claim in claims.get(property_id, []):
                mainsnak = claim.get("mainsnak", {})
                datavalue = mainsnak.get("datavalue", {})
                value = datavalue.get("value")
                if isinstance(value, dict) and "time" in value:
                    timeline.append({"property": property_id, "time": value["time"]})
        return timeline

    async def fetch_wikimedia_commons_media(self, query: str) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=30, headers={"User-Agent": self.settings.wikimedia_user_agent}) as client:
            response = await client.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "generator": "search",
                    "gsrsearch": query,
                    "gsrnamespace": 6,
                    "prop": "imageinfo",
                    "iiprop": "url|extmetadata",
                    "format": "json",
                    "gsrlimit": 5,
                },
            )
            response.raise_for_status()
            pages = response.json().get("query", {}).get("pages", {})
        media = []
        for page in pages.values():
            imageinfo = (page.get("imageinfo") or [{}])[0]
            media.append(
                {
                    "provider": "wikimedia-commons",
                    "title": page.get("title"),
                    "url": imageinfo.get("url"),
                    "description": imageinfo.get("extmetadata", {}).get("ImageDescription", {}).get("value"),
                }
            )
        return media

    async def fetch_internet_archive_media(self, query: str) -> list[dict[str, Any]]:
        params = {
            "q": query,
            "fl[]": ["identifier", "title", "mediatype"],
            "rows": 5,
            "output": "json",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://archive.org/advancedsearch.php?" + urlencode(params, doseq=True),
            )
            response.raise_for_status()
            docs = response.json().get("response", {}).get("docs", [])
        return [
            {
                "provider": "internet-archive",
                "identifier": doc.get("identifier"),
                "title": doc.get("title"),
                "media_type": doc.get("mediatype"),
                "details_url": f"https://archive.org/details/{doc.get('identifier')}",
            }
            for doc in docs
        ]

    async def fetch_pexels_videos(self, keywords: list[str]) -> list[dict[str, Any]]:
        if not self.settings.pexels_api_key:
            return []

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://api.pexels.com/videos/search",
                headers={"Authorization": self.settings.pexels_api_key},
                params={"query": " ".join(keywords), "per_page": 5, "orientation": "landscape"},
            )
            response.raise_for_status()
            videos = response.json().get("videos", [])

        return [
            {
                "provider": "pexels",
                "id": video.get("id"),
                "duration": video.get("duration"),
                "url": video.get("url"),
                "video_files": video.get("video_files", []),
            }
            for video in videos
        ]

    async def fetch_pixabay_videos(self, keywords: list[str]) -> list[dict[str, Any]]:
        if not self.settings.pixabay_api_key:
            return []

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://pixabay.com/api/videos/",
                params={
                    "key": self.settings.pixabay_api_key,
                    "q": " ".join(keywords),
                    "per_page": 5,
                    "safesearch": "true",
                },
            )
            response.raise_for_status()
            hits = response.json().get("hits", [])

        return [
            {
                "provider": "pixabay",
                "id": hit.get("id"),
                "tags": hit.get("tags"),
                "videos": hit.get("videos"),
                "duration": hit.get("duration"),
            }
            for hit in hits
        ]

    async def synthesize_narration(
        self,
        text: str,
        project_dir: Path,
        scene_number: int,
        voice_id: str = "JBFqnCBsd6RMkjVDRZzb",
    ) -> dict[str, Any]:
        if not self.settings.elevenlabs_api_key:
            raise ProviderError("ELEVENLABS_API_KEY is not configured.")

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps",
                headers={
                    "xi-api-key": self.settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.35, "similarity_boost": 0.8},
                },
            )
            response.raise_for_status()
            payload = response.json()

        manifest_path = project_dir / f"scene-{scene_number:02d}-elevenlabs.json"
        manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return {"provider": "elevenlabs", "manifest_path": str(manifest_path), "raw": payload}

    async def animate_image_with_wan(self, media_path: str, prompt: str, project_dir: Path, scene_number: int) -> dict[str, Any]:
        payload = {
            "model": "AnyFlow-Wan2.1-T2V-14B",
            "image_path": media_path,
            "prompt": prompt,
            "duration_seconds": 4,
            "aspect_ratio": "21:9",
        }
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{self.settings.nvidia_nim_base_url}/video/generations",
                headers=self._headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        manifest_path = project_dir / f"scene-{scene_number:02d}-wan.json"
        manifest_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return {"provider": "wan2.1", "manifest_path": str(manifest_path), "raw": data}

    async def run_liveportrait(self, image_url: str, audio_manifest: dict[str, Any]) -> dict[str, Any]:
        if not self.settings.liveportrait_base_url:
            return {"provider": "liveportrait", "status": "skipped", "reason": "LIVEPORTRAIT_BASE_URL not configured"}

        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{self.settings.liveportrait_base_url.rstrip('/')}/lip-sync",
                headers={"Authorization": f"Bearer {self.settings.liveportrait_api_key}"},
                json={"image_url": image_url, "audio": audio_manifest},
            )
            response.raise_for_status()
            return {"provider": "liveportrait", "raw": response.json()}

    async def run_deepvideo(self, liveportrait_output: dict[str, Any], prompt: str) -> dict[str, Any]:
        if not self.settings.deepvideo_base_url:
            return {"provider": "deepvideo-v1", "status": "skipped", "reason": "DEEVIDEO_BASE_URL not configured"}

        async with httpx.AsyncClient(timeout=240) as client:
            response = await client.post(
                f"{self.settings.deepvideo_base_url.rstrip('/')}/render-character",
                headers={"Authorization": f"Bearer {self.settings.deepvideo_api_key}"},
                json={"driver": liveportrait_output, "prompt": prompt},
            )
            response.raise_for_status()
            return {"provider": "deepvideo-v1", "raw": response.json()}

    async def download_asset(self, url: str, project_dir: Path, prefix: str) -> str:
        extension = Path(url.split("?")[0]).suffix or ".bin"
        output_path = project_dir / f"{prefix}-{uuid4().hex}{extension}"
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.get(url)
            response.raise_for_status()
            output_path.write_bytes(response.content)
        return str(output_path)
