from __future__ import annotations

import json

from app.schemas import GenerateStoryRequest, StoryScene
from app.services.providers import ProviderClients


ENGLISH_MODEL = "meta/llama-3.1-70b-instruct"
SOUTH_ASIA_MODEL = "qwen/qwen-2.5-72b-instruct"


class StoryGeneratorService:
    def __init__(self, providers: ProviderClients) -> None:
        self.providers = providers

    @staticmethod
    def select_model(language: str) -> str:
        if language == "english":
            return ENGLISH_MODEL
        return SOUTH_ASIA_MODEL

    async def generate_story(self, payload: GenerateStoryRequest) -> tuple[str, list[StoryScene]]:
        model = self.select_model(payload.language)
        system_prompt = (
            "You are an elite documentary script planner. "
            "Return only valid JSON with a top-level `scenes` array. "
            "The output must be strictly chronological, fact-aware, and optimized for premium retention. "
            "Every scene object must include: scene_number, narration_text, visual_keywords, "
            "is_abstract_scene, is_historical_character, character_name, location_coordinates. "
            "location_coordinates must be an object with latitude and longitude when geography matters, otherwise null."
        )
        user_prompt = (
            f"Create a {payload.target_duration_seconds}-second {payload.language} documentary script about: {payload.topic}\n"
            f"Tone: {payload.tone}\n"
            "Requirements:\n"
            "1. 8 to 12 scenes.\n"
            "2. Keep scene_number ascending with no gaps.\n"
            "3. narration_text should be vivid, fact-oriented, and broadcast quality.\n"
            "4. visual_keywords should be concrete search terms for photos or B-roll.\n"
            "5. Use is_abstract_scene=true only where archival visuals are unlikely.\n"
            "6. Use is_historical_character=true only when a real person appears on screen.\n"
            "7. character_name must be null unless is_historical_character=true.\n"
            "8. Return JSON only."
        )
        raw_response = await self.providers.chat_completion(
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(raw_response)
        scenes = [StoryScene.model_validate(scene) for scene in parsed["scenes"]]
        ordered_scenes = sorted(scenes, key=lambda item: item.scene_number)
        for index, scene in enumerate(ordered_scenes, start=1):
            if scene.scene_number != index:
                raise ValueError("Scenes must be strictly chronological with consecutive scene numbers.")
        return model, ordered_scenes
