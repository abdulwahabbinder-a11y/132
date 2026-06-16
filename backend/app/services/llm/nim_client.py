import json
import logging
import re
from typing import Any

import httpx

from app.config import get_settings
from app.schemas.story import LocationCoordinates, SceneScript, StoryScript

logger = logging.getLogger(__name__)

STORY_SYSTEM_PROMPT = """You are an elite documentary scriptwriter in the style of Vox and Mighty Monk.
Generate a strictly chronological documentary script as valid JSON only.

Output format (JSON array of scenes):
[
  {
    "scene_number": 1,
    "narration_text": "Engaging narration...",
    "visual_keywords": ["keyword1", "keyword2"],
    "is_abstract_scene": false,
    "is_historical_character": false,
    "character_name": null,
    "location_coordinates": {"lat": 40.7128, "lng": -74.0060, "label": "New York"}
  }
]

Rules:
- Scenes must be in strict chronological order
- narration_text should be conversational, high-retention documentary style
- visual_keywords: 3-5 specific search terms for B-roll
- is_abstract_scene: true for concepts, emotions, metaphors without real footage
- is_historical_character: true when featuring a named historical figure on camera
- character_name: full name if is_historical_character is true, else null
- location_coordinates: real lat/lng for geopolitical map sequences, null if N/A
- Return ONLY the JSON array, no markdown fences"""


class NvidiaNIMClient:
    def __init__(self, model: str):
        self.settings = get_settings()
        self.model = model
        self.base_url = self.settings.nvidia_nim_base_url

    async def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self.settings.nvidia_nim_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]


def _parse_scenes_json(raw: str) -> list[dict[str, Any]]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    parsed = json.loads(cleaned)
    if isinstance(parsed, dict) and "scenes" in parsed:
        return parsed["scenes"]
    if isinstance(parsed, list):
        return parsed
    raise ValueError("Unexpected JSON structure from LLM")


def _build_story(
    topic: str, language: str, scenes_data: list[dict[str, Any]]
) -> StoryScript:
    scenes: list[SceneScript] = []
    for i, scene in enumerate(scenes_data):
        coords = scene.get("location_coordinates")
        location = None
        if coords and isinstance(coords, dict):
            location = LocationCoordinates(
                lat=float(coords["lat"]),
                lng=float(coords["lng"]),
                label=coords.get("label"),
            )

        scenes.append(
            SceneScript(
                scene_number=scene.get("scene_number", i + 1),
                narration_text=scene["narration_text"],
                visual_keywords=scene.get("visual_keywords", []),
                is_abstract_scene=bool(scene.get("is_abstract_scene", False)),
                is_historical_character=bool(
                    scene.get("is_historical_character", False)
                ),
                character_name=scene.get("character_name"),
                location_coordinates=location,
            )
        )

    return StoryScript(
        title=f"Documentary: {topic}",
        topic=topic,
        language=language,
        scenes=scenes,
    )
