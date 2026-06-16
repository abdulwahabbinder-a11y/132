import httpx

from app.core.config import get_settings
from app.services.nim_client import NIMClient

settings = get_settings()


class CharacterEngineService:
    def __init__(self, nim_client: NIMClient | None = None) -> None:
        self.nim = nim_client or NIMClient()

    async def render_character_scene(
        self, character_image_url: str, audio_url: str, character_name: str
    ) -> dict:
        """
        1) LivePortrait for precise lip sync.
        2) DeepVideo-V1 for temporal consistency, micro-expressions and cleanup.
        """
        liveportrait_output = await self._run_liveportrait(character_image_url, audio_url)
        deepvideo_output = await self.nim.run_deepvideo(
            source_video_url=liveportrait_output["video_url"],
            guidance=f"Documentary realism for {character_name}. Preserve identity and facial fidelity.",
        )
        return {"liveportrait": liveportrait_output, "deepvideo": deepvideo_output}

    async def _run_liveportrait(self, image_url: str, audio_url: str) -> dict:
        payload = {"image_url": image_url, "audio_url": audio_url}
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(settings.liveportrait_api_url, json=payload)
            response.raise_for_status()
            return response.json()
