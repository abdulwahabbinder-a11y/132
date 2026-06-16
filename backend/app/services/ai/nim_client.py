"""Thin async client for NVIDIA NIM (OpenAI-compatible) endpoints.

NIM exposes both chat-completion LLMs (Llama 3.1, Qwen 2.5) and generative
image/video models (Flux, Wan2.1) through ``integrate.api.nvidia.com``. This
client wraps both styles with retries.
"""

from __future__ import annotations

from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger


class NIMNotConfiguredError(RuntimeError):
    pass


class NIMClient:
    def __init__(self) -> None:
        self.base_url = settings.nvidia_nim_base_url.rstrip("/")
        self.api_key = settings.nvidia_nim_api_key

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise NIMNotConfiguredError("NVIDIA_NIM_API_KEY is not set.")
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=30),
        reraise=True,
    )
    async def chat_completion(
        self,
        model: str,
        messages: list[dict[str, str]],
        *,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        response_format: dict[str, Any] | None = None,
    ) -> str:
        """Call a chat-completion model and return the assistant message text."""
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        logger.debug("NIM chat_completion model={}", model)
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=60),
        reraise=True,
    )
    async def generate_image(
        self,
        model: str,
        prompt: str,
        *,
        width: int = 1344,
        height: int = 576,
        steps: int = 50,
    ) -> bytes:
        """Generate an image (e.g. Flux) and return raw bytes (PNG)."""
        import base64

        logger.debug("NIM generate_image model={}", model)
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(
                f"{self.base_url}/genai/{model}",
                headers=self._headers(),
                json={
                    "prompt": prompt,
                    "width": width,
                    "height": height,
                    "steps": steps,
                    "cfg_scale": 3.5,
                },
            )
            resp.raise_for_status()
            data = resp.json()
        b64 = data["artifacts"][0]["base64"] if "artifacts" in data else data["image"]
        return base64.b64decode(b64)

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=2, max=60),
        reraise=True,
    )
    async def image_to_video(
        self,
        model: str,
        image_bytes: bytes,
        *,
        prompt: str = "",
        duration_seconds: int = 4,
    ) -> bytes:
        """Animate a static image into a short clip via Wan2.1 T2V/I2V."""
        import base64

        logger.debug("NIM image_to_video model={}", model)
        async with httpx.AsyncClient(timeout=600) as client:
            resp = await client.post(
                f"{self.base_url}/genai/{model}",
                headers=self._headers(),
                json={
                    "image": base64.b64encode(image_bytes).decode(),
                    "prompt": prompt,
                    "duration": duration_seconds,
                    "fps": 24,
                },
            )
            resp.raise_for_status()
            data = resp.json()
        return base64.b64decode(data["video"])


def get_nim_client() -> NIMClient:
    return NIMClient()
