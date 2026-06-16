"""Thin async client for the NVIDIA NIM API.

NVIDIA NIM exposes an OpenAI-compatible surface for chat completions plus
dedicated endpoints for image (Flux) and video (Wan2.1 / DeepVideo) models.
This client wraps the HTTP contracts and gracefully degrades to deterministic
mock output when ``NVIDIA_NIM_API_KEY`` is not configured, so the pipeline is
runnable end-to-end in development.
"""

from __future__ import annotations

import base64
from typing import Any, Dict, List, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


class NimClient:
    def __init__(self) -> None:
        self.base_url = settings.NVIDIA_NIM_BASE_URL.rstrip("/")
        self.api_key = settings.NVIDIA_NIM_API_KEY

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=20))
    async def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.6,
        max_tokens: int = 4096,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Run a chat completion and return the assistant message content."""
        if not self.enabled:
            log.warning("nim.chat.mock", model=model)
            return _mock_chat_response(messages)

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=20))
    async def generate_image(self, prompt: str, model: Optional[str] = None) -> bytes:
        """Generate a photorealistic image (Flux). Returns raw PNG/JPEG bytes."""
        model = model or settings.NIM_IMAGE_MODEL
        if not self.enabled:
            log.warning("nim.image.mock", model=model)
            return _mock_png_bytes()

        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.post(
                f"{self.base_url}/images/generations",
                headers=self._headers(),
                json={
                    "model": model,
                    "prompt": prompt,
                    "width": 1344,
                    "height": 576,  # ~21:9
                    "steps": 40,
                    "cfg_scale": 4.5,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            b64 = data["data"][0]["b64_json"] if "data" in data else data["artifacts"][0]["base64"]
            return base64.b64decode(b64)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
    async def animate_image_to_video(
        self, image_bytes: bytes, motion_prompt: str, duration_s: int = 4
    ) -> bytes:
        """Animate a static image into a short cinematic clip via Wan2.1 T2V."""
        if not self.enabled:
            log.warning("nim.video.mock", model=settings.NIM_VIDEO_MODEL)
            return image_bytes  # caller falls back to a Ken-Burns still

        b64 = base64.b64encode(image_bytes).decode()
        async with httpx.AsyncClient(timeout=600) as client:
            resp = await client.post(
                f"{self.base_url}/video/generations",
                headers=self._headers(),
                json={
                    "model": settings.NIM_VIDEO_MODEL,
                    "image": f"data:image/png;base64,{b64}",
                    "prompt": motion_prompt,
                    "duration": duration_s,
                    "fps": 24,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return base64.b64decode(data["video"])


def _mock_chat_response(messages: List[Dict[str, str]]) -> str:
    """Return a small, valid scene-JSON payload for offline dev."""
    import json

    topic = "the requested topic"
    for m in messages:
        if m.get("role") == "user":
            topic = m["content"][:80]
    return json.dumps(
        {
            "scenes": [
                {
                    "scene_number": 1,
                    "narration_text": f"In the beginning, {topic} set events in motion.",
                    "visual_keywords": ["archive", "old city", "history"],
                    "is_abstract_scene": False,
                    "is_historical_character": False,
                    "character_name": None,
                    "location_coordinates": {"lat": 48.8566, "lng": 2.3522, "label": "Paris"},
                },
                {
                    "scene_number": 2,
                    "narration_text": "But beneath the surface, an idea was forming.",
                    "visual_keywords": ["abstract", "concept", "mind"],
                    "is_abstract_scene": True,
                    "is_historical_character": False,
                    "character_name": None,
                    "location_coordinates": None,
                },
            ]
        }
    )


def _mock_png_bytes() -> bytes:
    """A 1x1 transparent PNG so downstream stages have a real file."""
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )


nim_client = NimClient()
