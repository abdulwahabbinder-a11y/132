from __future__ import annotations

from pathlib import Path

import httpx

from app.core.config import Settings
from app.schemas import MediaAsset, StoryScene, VoiceoverResult
from app.services.nim_client import NimClient


class CharacterVideoEngine:
    """Coordinates Wan2.1 animation, LivePortrait lip sync, and DeepVideo-V1 enhancement."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.nim = NimClient(settings)

    async def create_cinematic_clip(
        self,
        *,
        scene: StoryScene,
        assets: list[MediaAsset],
        voiceover: VoiceoverResult,
        output_dir: Path,
    ) -> str | None:
        still_asset = self._select_still_asset(assets)
        if not still_asset:
            stock_video = next((asset for asset in assets if asset.asset_type == "video" and asset.url), None)
            return stock_video.url if stock_video else None

        image_ref = still_asset.local_path or still_asset.url
        if not image_ref:
            return None

        wan_output = output_dir / f"scene-{scene.scene_number:03d}-wan.mp4"
        wan_response = await self.nim.animate_with_wan(
            image_url_or_path=image_ref,
            prompt=", ".join(scene.visual_keywords),
            output_path=str(wan_output),
        )
        animated_ref = self._extract_video_ref(wan_response) or str(wan_output)

        if not scene.is_historical_character:
            return animated_ref

        liveportrait_ref = await self._lip_sync_with_liveportrait(
            scene=scene,
            image_ref=image_ref,
            fallback_ref=animated_ref,
            audio_path=voiceover.audio_path,
            output_dir=output_dir,
        )
        deepvideo_output = output_dir / f"scene-{scene.scene_number:03d}-deepvideo.mp4"
        deepvideo_response = await self.nim.enhance_with_deepvideo(
            video_url_or_path=liveportrait_ref,
            audio_path=voiceover.audio_path,
            output_path=str(deepvideo_output),
        )
        return self._extract_video_ref(deepvideo_response) or str(deepvideo_output)

    async def _lip_sync_with_liveportrait(
        self,
        *,
        scene: StoryScene,
        image_ref: str,
        fallback_ref: str,
        audio_path: str,
        output_dir: Path,
    ) -> str:
        output_path = output_dir / f"scene-{scene.scene_number:03d}-liveportrait.mp4"
        if not self.settings.liveportrait_api_url:
            return fallback_ref

        payload = {
            "character_name": scene.character_name,
            "source_image": image_ref,
            "driving_audio": audio_path,
            "output_path": str(output_path),
            "lip_sync_mode": "precise",
        }
        async with httpx.AsyncClient(timeout=600) as client:
            response = await client.post(self.settings.liveportrait_api_url, json=payload)
        response.raise_for_status()
        return response.json().get("video_url") or str(output_path)

    @staticmethod
    def _select_still_asset(assets: list[MediaAsset]) -> MediaAsset | None:
        preferred_order = ["wikimedia", "flux", "internet_archive"]
        for provider in preferred_order:
            match = next((asset for asset in assets if asset.provider == provider and asset.asset_type == "image"), None)
            if match:
                return match
        return next((asset for asset in assets if asset.asset_type == "image"), None)

    @staticmethod
    def _extract_video_ref(provider_response: dict) -> str | None:
        response = provider_response.get("provider_response", provider_response)
        if isinstance(response, dict):
            data = response.get("data")
            if isinstance(data, list) and data:
                first = data[0]
                if isinstance(first, dict):
                    return first.get("url") or first.get("video_url")
            return response.get("url") or response.get("video_url")
        return None
