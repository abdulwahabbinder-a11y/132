import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings
from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class PixabayClient:
    def __init__(self):
        self.api_key = get_platform_setting("pixabay_api_key") or get_settings().pixabay_api_key
        self.base_url = "https://pixabay.com/api/videos/"

    async def search_videos(
        self, keywords: list[str], output_dir: Path | None = None, per_page: int = 3
    ) -> list[dict[str, Any]]:
        query = "+".join(keywords[:3])
        assets: list[dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            resp = await client.get(
                self.base_url,
                params={
                    "key": self.api_key,
                    "q": query,
                    "per_page": per_page,
                    "video_type": "film",
                    "orientation": "horizontal",
                },
            )
            resp.raise_for_status()
            hits = resp.json().get("hits", [])

            for hit in hits:
                videos = hit.get("videos", {})
                best = videos.get("large") or videos.get("medium") or videos.get("small")
                if not best:
                    continue

                local_path = None
                if output_dir and best.get("url"):
                    output_dir.mkdir(parents=True, exist_ok=True)
                    local_path = output_dir / f"pixabay_{hit['id']}.mp4"
                    vid_resp = await client.get(best["url"])
                    vid_resp.raise_for_status()
                    local_path.write_bytes(vid_resp.content)

                assets.append(
                    {
                        "source": "pixabay",
                        "id": hit["id"],
                        "url": best.get("url"),
                        "local_path": str(local_path) if local_path else None,
                        "duration": hit.get("duration"),
                        "width": best.get("width"),
                        "height": best.get("height"),
                    }
                )

        logger.info("Fetched %d Pixabay videos for '%s'", len(assets), query)
        return assets
