import json

from fastapi import HTTPException, status
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.story import GenerateStoryRequest, SceneSchema
from app.services.nim_client import NIMClient

settings = get_settings()


class StoryService:
    def __init__(self, nim_client: NIMClient | None = None) -> None:
        self.nim = nim_client or NIMClient()

    async def generate_story(self, req: GenerateStoryRequest) -> list[SceneSchema]:
        selected_model = settings.nim_model_regional if req.use_regional_model else settings.nim_model_english
        prompt = self._build_story_prompt(req)
        raw = await self.nim.chat_completion(
            model=selected_model,
            messages=[
                {"role": "system", "content": "You are a documentary script generator with strict JSON output."},
                {"role": "user", "content": prompt},
            ],
        )
        try:
            payload = json.loads(raw)
            scenes = [SceneSchema(**scene) for scene in payload["scenes"]]
        except (json.JSONDecodeError, KeyError, ValidationError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Model returned invalid scene JSON schema.",
            ) from exc

        self._ensure_chronological_order(scenes)
        return scenes

    @staticmethod
    def _ensure_chronological_order(scenes: list[SceneSchema]) -> None:
        expected = 1
        for scene in scenes:
            if scene.scene_number != expected:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Scene order is not strictly chronological.",
                )
            expected += 1

    @staticmethod
    def _build_story_prompt(req: GenerateStoryRequest) -> str:
        return f"""
Create a high-retention documentary script about: {req.topic}
Language: {req.language}
Target duration: {req.target_duration_seconds} seconds.
Tone: premium explanatory style similar to modern documentary channels.

Output ONLY valid JSON in this exact shape:
{{
  "scenes": [
    {{
      "scene_number": 1,
      "narration_text": "...",
      "visual_keywords": ["..."],
      "is_abstract_scene": false,
      "is_historical_character": false,
      "character_name": null,
      "location_coordinates": "lat,lng"
    }}
  ]
}}

Rules:
- scene_number must be sequential 1..N with no gaps.
- narration_text must be factual and chronological.
- set is_historical_character true only when a specific person appears.
- include realistic coordinates for map animation.
- keep narration concise per scene for pacing.
""".strip()
