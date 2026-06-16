from __future__ import annotations

import json

from pydantic import TypeAdapter, ValidationError

from app.core.config import Settings
from app.schemas import GenerateStoryRequest, StoryScene
from app.services.nim_client import NimClient


SCENE_LIST_ADAPTER = TypeAdapter(list[StoryScene])


class ScriptRouter:
    """Routes script generation to Llama for English and Qwen for South Asian scripts."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.nim = NimClient(settings)

    async def generate_story(self, request: GenerateStoryRequest) -> list[StoryScene]:
        model = self._select_model(request.language)
        system_prompt = self._system_prompt()
        user_prompt = self._user_prompt(request)
        raw_content = await self.nim.chat_json(model=model, system_prompt=system_prompt, user_prompt=user_prompt)
        return self._parse_scene_payload(raw_content)

    def _select_model(self, language: str) -> str:
        if language == "en":
            return self.settings.nim_llama_model
        return self.settings.nim_qwen_model

    @staticmethod
    def _system_prompt() -> str:
        return (
            "You are an elite documentary writer and chronology researcher for a subscription SaaS. "
            "Write in a premium high-retention documentary style inspired by modern explanatory channels, "
            "without copying any channel's exact voice. Return only valid JSON. The root object must be "
            "{\"scenes\": [...]} and scenes must be strictly chronological. Each scene object must contain "
            "exactly these keys: scene_number, narration_text, visual_keywords, is_abstract_scene, "
            "is_historical_character, character_name, location_coordinates. visual_keywords must be an array "
            "of concrete search terms. location_coordinates must be null or an object with lat and lng."
        )

    @staticmethod
    def _user_prompt(request: GenerateStoryRequest) -> str:
        scene_count = max(4, min(24, request.target_duration_minutes * 2))
        return (
            f"Topic: {request.topic}\n"
            f"Language/script: {request.language}\n"
            f"Target duration minutes: {request.target_duration_minutes}\n"
            f"Tone: {request.tone}\n"
            f"Create {scene_count} chronological scenes. Narration should be concise, cinematic, factual, "
            "and optimized for retention with clear cause-and-effect transitions. Mark abstract scenes only "
            "when no verifiable archival or real-world visual can reasonably represent the beat."
        )

    @staticmethod
    def _parse_scene_payload(raw_content: str) -> list[StoryScene]:
        try:
            payload = json.loads(raw_content)
            scenes_payload = payload["scenes"] if isinstance(payload, dict) else payload
            scenes = SCENE_LIST_ADAPTER.validate_python(scenes_payload)
        except (json.JSONDecodeError, KeyError, TypeError, ValidationError) as exc:
            raise ValueError("NIM script response did not match the required chronological scene JSON schema") from exc

        sorted_scenes = sorted(scenes, key=lambda item: item.scene_number)
        expected_numbers = list(range(1, len(sorted_scenes) + 1))
        actual_numbers = [scene.scene_number for scene in sorted_scenes]
        if actual_numbers != expected_numbers:
            raise ValueError("Scene numbers must be contiguous and chronological starting at 1")
        return sorted_scenes
