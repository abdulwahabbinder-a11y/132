"""
Public Data Scraper & Multi-Source Media Fetcher.

For each scene:
  • Real facts       → Wikipedia REST API / Wikidata SPARQL
  • Archival photos  → Wikimedia Commons API + Internet Archive
  • Stock footage    → Pexels API + Pixabay API
  • Abstract/AI art  → NVIDIA NIM (stabilityai/flux-1-dev)
"""

import asyncio
import base64
import os
import structlog
import aiohttp
import aiofiles
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential
from openai import AsyncOpenAI

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

WIKIPEDIA_API = "https://en.wikipedia.org/api/rest_v1"
WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
WIKIMEDIA_COMMONS_API = "https://commons.wikimedia.org/w/api.php"
ARCHIVE_ORG_SEARCH = "https://archive.org/advancedsearch.php"
PEXELS_API = "https://api.pexels.com/videos/search"
PIXABAY_API = "https://pixabay.com/api/videos/"


class ScraperService:
    def __init__(self):
        self.nim_client = AsyncOpenAI(
            base_url=settings.NVIDIA_BASE_URL,
            api_key=settings.NVIDIA_API_KEY,
        )
        Path(settings.ASSETS_DIR).mkdir(parents=True, exist_ok=True)

    # ── Wikipedia Facts ────────────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=5))
    async def fetch_wikipedia_summary(self, topic: str) -> dict:
        """Fetch a Wikipedia article summary for factual grounding."""
        async with aiohttp.ClientSession() as session:
            url = f"{WIKIPEDIA_API}/page/summary/{topic.replace(' ', '_')}"
            headers = {"User-Agent": settings.WIKIMEDIA_USER_AGENT}
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    return await resp.json()
                return {}

    # ── Wikimedia Commons Archival Photos ─────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=5))
    async def fetch_wikimedia_image(self, query: str) -> str | None:
        """Search Wikimedia Commons for a historical image, return direct URL."""
        params = {
            "action": "query",
            "list": "search",
            "srnamespace": "6",  # File namespace
            "srsearch": f"{query} photo historical",
            "srlimit": "5",
            "format": "json",
        }
        headers = {"User-Agent": settings.WIKIMEDIA_USER_AGENT}
        async with aiohttp.ClientSession() as session:
            async with session.get(
                WIKIMEDIA_COMMONS_API, params=params, headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                results = data.get("query", {}).get("search", [])
                if not results:
                    return None

                title = results[0]["title"]
                return await self._get_wikimedia_file_url(title, session, headers)

    async def _get_wikimedia_file_url(self, title: str, session: aiohttp.ClientSession, headers: dict) -> str | None:
        params = {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json",
        }
        async with session.get(
            WIKIMEDIA_COMMONS_API, params=params, headers=headers,
            timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                imageinfo = page.get("imageinfo", [])
                if imageinfo:
                    return imageinfo[0].get("url")
        return None

    # ── Internet Archive ───────────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
    async def fetch_archive_media(self, query: str) -> str | None:
        """Search Internet Archive for archival footage/images."""
        params = {
            "q": f"{query} mediatype:(image OR video)",
            "fl[]": ["identifier", "title"],
            "rows": "5",
            "output": "json",
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(
                ARCHIVE_ORG_SEARCH, params=params,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                docs = data.get("response", {}).get("docs", [])
                if docs:
                    identifier = docs[0]["identifier"]
                    return f"https://archive.org/download/{identifier}"
        return None

    # ── Pexels Stock Footage ───────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=5))
    async def fetch_pexels_video(self, keywords: list[str]) -> str | None:
        """Fetch HD stock footage from Pexels."""
        query = " ".join(keywords[:3])
        headers = {"Authorization": settings.PEXELS_API_KEY}
        params = {"query": query, "per_page": 5, "size": "medium"}

        async with aiohttp.ClientSession() as session:
            async with session.get(
                PEXELS_API, headers=headers, params=params,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                videos = data.get("videos", [])
                if not videos:
                    return None
                # Pick the best quality HD file
                files = videos[0].get("video_files", [])
                hd_files = [f for f in files if f.get("quality") in ("hd", "sd")]
                if hd_files:
                    return hd_files[0]["link"]
        return None

    # ── Pixabay Stock Footage ─────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=5))
    async def fetch_pixabay_video(self, keywords: list[str]) -> str | None:
        """Fetch stock footage from Pixabay as fallback."""
        query = "+".join(keywords[:3])
        params = {
            "key": settings.PIXABAY_API_KEY,
            "q": query,
            "video_type": "film",
            "per_page": 5,
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(
                PIXABAY_API, params=params,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                hits = data.get("hits", [])
                if not hits:
                    return None
                videos = hits[0].get("videos", {})
                medium = videos.get("medium") or videos.get("small")
                return medium.get("url") if medium else None

    # ── NVIDIA NIM Flux AI Image Generation ───────────────────────────────────

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=2, max=10))
    async def generate_flux_image(
        self, prompt: str, scene_id: str, scene_number: int
    ) -> str | None:
        """
        Generate a photorealistic image for abstract scenes via
        stabilityai/flux-1-dev (NVIDIA NIM).
        Returns local file path.
        """
        logger.info("scraper.flux_generate", scene=scene_number, prompt=prompt[:60])
        enhanced_prompt = (
            f"Cinematic documentary photography, ultra-realistic, 8K resolution, "
            f"film grain, dramatic lighting: {prompt}"
        )
        try:
            response = await self.nim_client.images.generate(
                model="stabilityai/flux-1-dev",
                prompt=enhanced_prompt,
                n=1,
                size="1344x768",  # 16:9 ≈ cinematic
                response_format="b64_json",
            )
            b64 = response.data[0].b64_json
            img_bytes = base64.b64decode(b64)

            out_path = os.path.join(settings.ASSETS_DIR, f"{scene_id}_flux.png")
            async with aiofiles.open(out_path, "wb") as f:
                await f.write(img_bytes)

            logger.info("scraper.flux_saved", path=out_path)
            return out_path
        except Exception as exc:
            logger.error("scraper.flux_error", error=str(exc))
            return None

    # ── Asset Downloader ──────────────────────────────────────────────────────

    async def download_asset(self, url: str, dest_path: str) -> str | None:
        """Download any asset URL to local path."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                    if resp.status != 200:
                        return None
                    async with aiofiles.open(dest_path, "wb") as f:
                        async for chunk in resp.content.iter_chunked(65536):
                            await f.write(chunk)
            return dest_path
        except Exception as exc:
            logger.error("scraper.download_error", url=url[:80], error=str(exc))
            return None
