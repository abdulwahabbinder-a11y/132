"""Thin async HTTP client around the NVIDIA NIM Chat Completions API."""

from __future__ import annotations

import json
from typing import Any

import httpx
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings
from app.core.logging import logger


class NimError(RuntimeError):
    pass


class NimChatClient:
    """Async chat-completions client compatible with NVIDIA NIM."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 120.0,
    ) -> None:
        self.api_key = api_key or settings.nvidia_nim_api_key
        self.base_url = (base_url or settings.nvidia_nim_base_url).rstrip("/")
        if not self.api_key:
            raise NimError("NVIDIA_NIM_API_KEY is not configured.")
        self._client = httpx.AsyncClient(
            timeout=timeout,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "NimChatClient":
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.aclose()

    async def chat_completion(
        self,
        *,
        model: str,
        messages: list[dict[str, Any]],
        temperature: float = 0.4,
        top_p: float = 0.9,
        max_tokens: int = 4096,
        response_format: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens,
            "stream": False,
        }
        if response_format is not None:
            payload["response_format"] = response_format

        url = f"{self.base_url}/chat/completions"
        logger.info("NIM chat completion → {} ({} msgs)", model, len(messages))

        async for attempt in AsyncRetrying(
            wait=wait_exponential(multiplier=1, min=2, max=20),
            stop=stop_after_attempt(3),
            retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError)),
            reraise=True,
        ):
            with attempt:
                response = await self._client.post(url, json=payload)
                response.raise_for_status()
                return response.json()

        raise NimError("NIM chat completion failed after retries.")

    async def json_completion(
        self,
        *,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict[str, Any]:
        """Force JSON output and parse it."""
        raw = await self.chat_completion(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        try:
            content = raw["choices"][0]["message"]["content"]
            return json.loads(content)
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise NimError(f"Could not parse NIM JSON output: {exc}\n{raw}") from exc

    async def image_generation(
        self,
        *,
        model: str,
        prompt: str,
        negative_prompt: str | None = None,
        width: int = 1920,
        height: int = 824,
        cfg_scale: float = 5.0,
        steps: int = 30,
    ) -> dict[str, Any]:
        """Call a NIM diffusion endpoint (e.g. Flux 1-dev)."""
        url = f"{self.base_url}/images/generations"
        payload = {
            "model": model,
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "cfg_scale": cfg_scale,
            "steps": steps,
        }
        response = await self._client.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    async def video_generation(
        self,
        *,
        model: str,
        prompt: str,
        image_url: str | None = None,
        duration_seconds: float = 4.0,
        fps: int = 24,
        extra: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Call a NIM video endpoint (Wan 2.1, DeepVideo-V1)."""
        url = f"{self.base_url}/video/generations"
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "duration_seconds": duration_seconds,
            "fps": fps,
        }
        if image_url:
            payload["image_url"] = image_url
        if extra:
            payload.update(extra)
        response = await self._client.post(url, json=payload, timeout=600.0)
        response.raise_for_status()
        return response.json()
