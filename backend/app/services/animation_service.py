from app.services.nim_client import NIMClient


class AnimationService:
    def __init__(self, nim_client: NIMClient | None = None) -> None:
        self.nim = nim_client or NIMClient()

    async def animate_image_to_clip(self, image_url: str, guidance_prompt: str) -> dict:
        return await self.nim.run_wan_t2v(
            image_url=image_url,
            prompt=guidance_prompt,
            duration_seconds=4,
        )
