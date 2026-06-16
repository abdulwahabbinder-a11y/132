import base64
import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class LivePortraitService:
    """Precise lip-sync for historical character scenes."""

    def __init__(self):
        self.settings = get_settings()
        self.base_url = f"{self.settings.nvidia_nim_base_url}/liveportrait"

    async def lip_sync(
        self,
        portrait_image_path: Path,
        audio_slice_path: Path,
        output_path: Path,
    ) -> dict[str, Any]:
        image_b64 = base64.b64encode(portrait_image_path.read_bytes()).decode()
        audio_b64 = base64.b64encode(audio_slice_path.read_bytes()).decode()

        headers = {
            "Authorization": f"Bearer {self.settings.nvidia_nim_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "source_image": image_b64,
            "driving_audio": audio_b64,
            "output_format": "mp4",
            "lip_sync_strength": 0.85,
            "head_motion_scale": 0.3,
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.base_url}/generate",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            video_b64 = data.get("video") or data.get("output", {}).get("video")
            if not video_b64 and "artifacts" in data:
                video_b64 = data["artifacts"][0].get("base64")

            if not video_b64:
                raise ValueError("No video in LivePortrait response")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(base64.b64decode(video_b64))

        logger.info("LivePortrait lip-sync output: %s", output_path)
        return {"source": "liveportrait", "local_path": str(output_path)}
