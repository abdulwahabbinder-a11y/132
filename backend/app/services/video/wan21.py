import base64
import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

WAN21_MODEL = "AnyFlow-Wan2.1-T2V-14B"


class Wan21Animator:
    """Animates static images into 4-second cinematic motion clips via NVIDIA NIM."""

    def __init__(self):
        self.settings = get_settings()

    async def animate_image(
        self,
        image_path: Path,
        prompt: str,
        output_path: Path,
        duration_seconds: float = 4.0,
    ) -> dict[str, Any]:
        image_b64 = base64.b64encode(image_path.read_bytes()).decode()

        headers = {
            "Authorization": f"Bearer {self.settings.nvidia_nim_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": WAN21_MODEL,
            "image": image_b64,
            "prompt": f"Cinematic slow camera movement, {prompt}, documentary style, smooth motion",
            "duration": duration_seconds,
            "fps": 24,
            "resolution": "1280x720",
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.settings.nvidia_nim_base_url}/video/generations",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            video_b64 = None
            if "data" in data and data["data"]:
                video_b64 = data["data"][0].get("b64_json") or data["data"][0].get("video")
            elif "video" in data:
                video_b64 = data["video"]
            elif "artifacts" in data and data["artifacts"]:
                video_b64 = data["artifacts"][0].get("base64")

            if not video_b64:
                raise ValueError("No video data in Wan2.1 API response")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(base64.b64decode(video_b64))

        logger.info("Animated image to %s (%.1fs)", output_path, duration_seconds)
        return {
            "source": "wan21",
            "local_path": str(output_path),
            "duration_seconds": duration_seconds,
        }
