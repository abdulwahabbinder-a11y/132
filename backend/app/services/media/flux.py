import base64
import logging
from pathlib import Path
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)

FLUX_MODEL = "stabilityai/flux-1-dev"


class FluxImageGenerator:
    def __init__(self):
        pass

    async def generate_image(
        self,
        prompt: str,
        output_path: Path,
        width: int = 1920,
        height: int = 1080,
    ) -> dict[str, Any]:
        api_key = get_platform_setting("nvidia_nim_api_key")
        base_url = get_platform_setting("nvidia_nim_base_url") or "https://integrate.api.nvidia.com/v1"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        enhanced_prompt = (
            f"Photorealistic cinematic documentary still, {prompt}, "
            "dramatic lighting, 8K detail, film grain, no text"
        )

        payload = {
            "prompt": enhanced_prompt,
            "width": width,
            "height": height,
            "seed": 42,
            "steps": 30,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{base_url}/images/generations",
                headers=headers,
                json={"model": FLUX_MODEL, **payload},
            )
            response.raise_for_status()
            data = response.json()

            image_b64 = None
            if "data" in data and data["data"]:
                image_b64 = data["data"][0].get("b64_json")
            elif "artifacts" in data and data["artifacts"]:
                image_b64 = data["artifacts"][0].get("base64")
            elif "image" in data:
                image_b64 = data["image"]

            if not image_b64:
                raise ValueError("No image data in Flux API response")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(base64.b64decode(image_b64))

        logger.info("Generated Flux image at %s", output_path)
        return {
            "source": "flux_nim",
            "local_path": str(output_path),
            "prompt": enhanced_prompt,
            "width": width,
            "height": height,
        }
