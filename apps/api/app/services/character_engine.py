from typing import Any

import httpx

from app.core.config import Settings


class CharacterCinematicsEngine:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def render_character_scene(
        self,
        *,
        character_name: str,
        source_image_url: str | None,
        audio_url: str | None,
        narration_text: str,
    ) -> dict[str, Any]:
        liveportrait = await self._call_liveportrait(
            character_name=character_name,
            source_image_url=source_image_url,
            audio_url=audio_url,
        )
        deepvideo = await self._call_deepvideo(
            liveportrait_video_url=liveportrait.get("video_url"),
            narration_text=narration_text,
            character_name=character_name,
        )
        return {
            "character_name": character_name,
            "liveportrait": liveportrait,
            "deepvideo_v1": deepvideo,
            "final_character_clip": deepvideo.get("video_url") or liveportrait.get("video_url"),
        }

    async def _call_liveportrait(
        self,
        *,
        character_name: str,
        source_image_url: str | None,
        audio_url: str | None,
    ) -> dict[str, Any]:
        if not self.settings.liveportrait_url:
            return {"warning": "LIVEPORTRAIT_URL is not configured"}
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                self.settings.liveportrait_url,
                json={
                    "character_name": character_name,
                    "source_image_url": source_image_url,
                    "audio_url": audio_url,
                    "mode": "precise_lip_sync",
                },
            )
            response.raise_for_status()
            return response.json()

    async def _call_deepvideo(
        self,
        *,
        liveportrait_video_url: str | None,
        narration_text: str,
        character_name: str,
    ) -> dict[str, Any]:
        if not self.settings.deepvideo_v1_url:
            return {"warning": "DEEPVIDEO_V1_URL is not configured"}
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                self.settings.deepvideo_v1_url,
                json={
                    "input_video_url": liveportrait_video_url,
                    "prompt": (
                        f"High-fidelity neural documentary rendering of {character_name}; "
                        "preserve identity, realistic micro-expressions, temporal consistency, "
                        "cinematic key light, no flicker or warping."
                    ),
                    "narration_context": narration_text,
                    "temporal_consistency": "high",
                    "micro_expressions": True,
                },
            )
            response.raise_for_status()
            return response.json()
