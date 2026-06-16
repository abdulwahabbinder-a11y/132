import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class PexelsClient:
    def __init__(self):
        self.api_key = get_settings().pexels_api_key
        self.base_url = "https://api.pexels.com/videos"

    async def search_videos(
        self, keywords: list[str], output_dir: Path | None = None, per_page: int = 3
    ) -> list[dict[str, Any]]:
        query = " ".join(keywords[:3])
        assets: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            resp = await client.get(
                f"{self.base_url}/search",
                headers={"Authorization": self.api_key},
                params={"query": query, "per_page": per_page, "orientation": "landscape"},
            )
            resp.raise_for_status()
            videos = resp.json().get("videos", [])

            for video in videos:
                best_file = self._select_best_file(video.get("video_files", []))
                if not best_file:
                    continue

                local_path = None
                if output_dir and best_file.get("link"):
                    output_dir.mkdir(parents=True, exist_ok=True)
                    local_path = output_dir / f"pexels_{video['id']}.mp4"
                    vid_resp = await client.get(best_file["link"])
                    vid_resp.raise_for_status()
                    local_path.write_bytes(vid_resp.content)

                assets.append(
                    {
                        "source": "pexels",
                        "id": video["id"],
                        "url": best_file.get("link"),
                        "local_path": str(local_path) if local_path else None,
                        "duration": video.get("duration"),
                        "width": best_file.get("width"),
                        "height": best_file.get("height"),
                    }
                )

        logger.info("Fetched %d Pexels videos for '%s'", len(assets), query)
        return assets

    def _select_best_file(self, files: list[dict]) -> dict | None:
        hd_files = [f for f in files if f.get("quality") == "hd" and f.get("width", 0) >= 1280]
        if hd_files:
            return max(hd_files, key=lambda f: f.get("width", 0))
        return files[0] if files else None
