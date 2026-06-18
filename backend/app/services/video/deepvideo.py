import base64
import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings
from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)

DEEPVIDEO_MODEL = "deepvideo-v1"


class DeepVideoPipeline:
    """
    Advanced character neural rendering pipeline.
    Handles micro-expressions, temporal consistency, and anti-flicker synthesis.
    """

    def __init__(self):
        self.settings = get_settings()

    async def enhance_character_video(
        self,
        input_video_path: Path,
        character_name: str,
        output_path: Path,
        reference_image_path: Path | None = None,
    ) -> dict[str, Any]:
        api_key = get_platform_setting("nvidia_nim_api_key")
        if not api_key:
            raise ValueError("NVIDIA NIM API key is not configured")

        video_b64 = base64.b64encode(input_video_path.read_bytes()).decode()

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload: dict[str, Any] = {
            "model": DEEPVIDEO_MODEL,
            "input_video": video_b64,
            "character_name": character_name,
            "enhancement": {
                "micro_expressions": True,
                "temporal_consistency": True,
                "anti_flicker": True,
                "neural_rendering_quality": "high",
                "face_restoration": True,
            },
            "output_format": "mp4",
            "resolution": "1920x1080",
        }

        if reference_image_path and reference_image_path.exists():
            payload["reference_image"] = base64.b64encode(
                reference_image_path.read_bytes()
            ).decode()

        try:
            async with httpx.AsyncClient(timeout=600.0) as client:
                response = await client.post(
                    f"{self.settings.nvidia_nim_base_url}/video/enhance",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            logger.error("DeepVideo request failed: %s", exc)
            raise RuntimeError(f"DeepVideo enhancement failed: {exc}") from exc

        enhanced_b64 = (
            data.get("video")
            or data.get("output", {}).get("video")
            or (data.get("artifacts", [{}])[0].get("base64") if data.get("artifacts") else None)
        )

        if not enhanced_b64:
            raise ValueError("No enhanced video in DeepVideo-V1 response")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(base64.b64decode(enhanced_b64))

        logger.info("DeepVideo-V1 enhanced character video: %s", output_path)
        return {
            "source": "deepvideo_v1",
            "local_path": str(output_path),
            "character_name": character_name,
        }

    async def process_character_scene(
        self,
        portrait_path: Path,
        audio_path: Path,
        character_name: str,
        work_dir: Path,
    ) -> dict[str, Any]:
        from app.services.video.liveportrait import LivePortraitService

        liveportrait = LivePortraitService()
        lip_sync_path = work_dir / "lip_sync_raw.mp4"

        lip_sync_result = await liveportrait.lip_sync(
            portrait_image_path=portrait_path,
            audio_slice_path=audio_path,
            output_path=lip_sync_path,
        )

        enhanced_path = work_dir / "character_enhanced.mp4"
        enhanced_result = await self.enhance_character_video(
            input_video_path=Path(lip_sync_result["local_path"]),
            character_name=character_name,
            output_path=enhanced_path,
            reference_image_path=portrait_path,
        )

        return enhanced_result
