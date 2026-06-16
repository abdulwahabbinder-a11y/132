import json
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import Settings
from app.schemas.story import StoryGenerationRequest, StoryScene


class NvidiaNimClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = str(settings.nvidia_nim_base_url).rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
            "Content-Type": "application/json",
        }

    def select_story_model(self, language: str) -> str:
        if language == "english":
            return self.settings.nvidia_nim_llama_model
        return self.settings.nvidia_nim_qwen_model

    @retry(wait=wait_exponential(multiplier=1, min=1, max=8), stop=stop_after_attempt(3))
    async def generate_story(self, request: StoryGenerationRequest) -> list[StoryScene]:
        model = self.select_story_model(request.language)
        prompt = self._story_prompt(request)
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an elite documentary showrunner. Return only valid JSON. "
                        "Every scene must be chronological and fact-conscious."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.55,
            "top_p": 0.85,
            "max_tokens": 5000,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
        decoded = json.loads(content)
        scenes = decoded.get("scenes", decoded if isinstance(decoded, list) else [])
        parsed = [StoryScene.model_validate(scene) for scene in scenes]
        return sorted(parsed, key=lambda item: item.scene_number)

    async def generate_flux_image(self, prompt: str) -> dict[str, Any]:
        return await self._post_generation(
            model=self.settings.nvidia_nim_flux_model,
            payload={"prompt": prompt, "mode": "photorealistic-documentary-still"},
        )

    async def animate_image_with_wan(self, image_url: str, prompt: str) -> dict[str, Any]:
        return await self._post_generation(
            model=self.settings.nvidia_nim_wan_model,
            payload={
                "image_url": image_url,
                "prompt": prompt,
                "duration_seconds": 4,
                "camera_motion": "slow cinematic parallax dolly",
            },
        )

    async def _post_generation(self, *, model: str, payload: dict[str, Any]) -> dict[str, Any]:
        body = {"model": model, **payload}
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/images/generations",
                headers=self.headers,
                json=body,
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    def _story_prompt(request: StoryGenerationRequest) -> str:
        return f"""
Create a high-retention documentary script plan in the style of premium explanatory YouTube films.

Topic: {request.topic}
Language/script: {request.language}
Target duration: {request.target_duration_minutes} minutes
Tone: {request.tone}

Return strict JSON shaped exactly as:
{{
  "scenes": [
    {{
      "scene_number": 1,
      "narration_text": "...",
      "visual_keywords": ["keyword", "keyword"],
      "is_abstract_scene": false,
      "is_historical_character": false,
      "character_name": null,
      "location_coordinates": {{"latitude": 0, "longitude": 0, "label": "Place"}}
    }}
  ]
}}

Rules:
- Chronological order only.
- Each scene should contain one narrative beat.
- Use concrete visual keywords for scraping and B-roll retrieval.
- Mark abstract scenes only when real-world footage cannot convey the idea.
- Mark historical characters only when a named person is central to the scene.
- Include coordinates for geopolitical, travel, battle, migration, empire, or city scenes.
- Do not include markdown or commentary outside the JSON.
"""
