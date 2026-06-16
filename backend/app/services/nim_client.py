from collections.abc import Sequence

import httpx

from app.core.config import get_settings

settings = get_settings()


class NIMClient:
    def __init__(self) -> None:
        self.base_url = settings.nim_base_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {settings.nim_api_key}"}

    async def chat_completion(self, model: str, messages: Sequence[dict]) -> str:
        payload = {
            "model": model,
            "messages": list(messages),
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(f"{self.base_url}/chat/completions", headers=self.headers, json=payload)
            response.raise_for_status()
            body = response.json()
        return body["choices"][0]["message"]["content"]

    async def generate_image_flux(self, prompt: str) -> dict:
        payload = {"model": settings.nim_model_flux, "prompt": prompt, "num_images": 1}
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(f"{self.base_url}/images/generations", headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def run_wan_t2v(self, image_url: str, prompt: str, duration_seconds: int = 4) -> dict:
        payload = {
            "model": settings.nim_model_wan,
            "image_url": image_url,
            "prompt": prompt,
            "duration_seconds": duration_seconds,
        }
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(f"{self.base_url}/video/generations", headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def run_deepvideo(self, source_video_url: str, guidance: str) -> dict:
        payload = {
            "model": settings.nim_model_deepvideo,
            "source_video_url": source_video_url,
            "guidance": guidance,
        }
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(f"{self.base_url}/video/enhance", headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
