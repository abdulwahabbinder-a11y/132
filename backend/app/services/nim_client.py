from __future__ import annotations

from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import Settings


class NimClient:
    """Adapter for NVIDIA NIM chat, image, and video model calls."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = str(settings.nvidia_nim_base_url).rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
            "Content-Type": "application/json",
        }

    @retry(wait=wait_exponential(multiplier=1, min=1, max=8), stop=stop_after_attempt(3))
    async def chat_json(self, *, model: str, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.35,
            "top_p": 0.9,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(f"{self.base_url}/chat/completions", headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    @retry(wait=wait_exponential(multiplier=1, min=1, max=8), stop=stop_after_attempt(3))
    async def generate_flux_image(self, *, prompt: str, output_path: str) -> dict[str, Any]:
        payload = {
            "model": self.settings.nim_flux_model,
            "prompt": prompt,
            "aspect_ratio": "21:9",
            "output_format": "png",
        }
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(f"{self.base_url}/images/generations", headers=self.headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return {"provider_response": data, "suggested_output_path": output_path}

    @retry(wait=wait_exponential(multiplier=1, min=1, max=8), stop=stop_after_attempt(3))
    async def animate_with_wan(self, *, image_url_or_path: str, prompt: str, output_path: str) -> dict[str, Any]:
        payload = {
            "model": self.settings.nim_wan_model,
            "image": image_url_or_path,
            "prompt": prompt,
            "duration_seconds": 4,
            "motion_style": "slow cinematic parallax, archival documentary camera move",
        }
        async with httpx.AsyncClient(timeout=300) as client:
            response = await client.post(f"{self.base_url}/videos/generations", headers=self.headers, json=payload)
        response.raise_for_status()
        return {"provider_response": response.json(), "suggested_output_path": output_path}

    @retry(wait=wait_exponential(multiplier=1, min=1, max=8), stop=stop_after_attempt(3))
    async def enhance_with_deepvideo(self, *, video_url_or_path: str, audio_path: str, output_path: str) -> dict[str, Any]:
        payload = {
            "model": self.settings.nim_deepvideo_model,
            "video": video_url_or_path,
            "audio": audio_path,
            "objectives": [
                "high-fidelity character synthesis",
                "realistic micro-expressions",
                "temporal consistency",
                "no flicker",
                "no facial warping",
            ],
        }
        async with httpx.AsyncClient(timeout=600) as client:
            response = await client.post(f"{self.base_url}/videos/generations", headers=self.headers, json=payload)
        response.raise_for_status()
        return {"provider_response": response.json(), "suggested_output_path": output_path}
