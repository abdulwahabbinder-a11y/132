import json

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.story import DocumentaryScene, StoryGenerationRequest

settings = get_settings()

ENGLISH_MODEL = "meta/llama-3.1-70b-instruct"
SOUTH_ASIAN_MODEL = "qwen/qwen-2.5-72b-instruct"


class DocumentaryScriptService:
    def select_model(self, language: str) -> str:
        normalized = language.lower()
        if normalized in {"hindi", "urdu", "roman-urdu", "roman"}:
            return SOUTH_ASIAN_MODEL
        return ENGLISH_MODEL

    def build_messages(self, request: StoryGenerationRequest) -> list[dict[str, str]]:
        system_prompt = """
You are an elite documentary showrunner writing scene-by-scene scripts for premium long-form YouTube documentaries.
Return only valid JSON with the shape:
{
  "story": [
    {
      "scene_number": 1,
      "narration_text": "...",
      "visual_keywords": ["..."],
      "is_abstract_scene": false,
      "is_historical_character": false,
      "character_name": null,
      "location_coordinates": {"latitude": 0.0, "longitude": 0.0}
    }
  ]
}

Rules:
- Story must be strictly chronological.
- Every scene_number must increase by exactly 1.
- narration_text must be cinematic, factual, retention-focused, and ready for voiceover.
- visual_keywords must describe searchable archival, geographic, or b-roll visuals.
- Use real coordinates whenever a location is relevant; otherwise use null.
- Mark is_abstract_scene=true when concrete archival media is unlikely or symbolism is stronger.
- Mark is_historical_character=true only when a real historical person should appear on screen.
- character_name must be null unless is_historical_character=true.
- Never include markdown, prose, or explanatory text outside the JSON.
""".strip()

        user_prompt = f"""
Topic: {request.topic}
Language: {request.language}
Target duration seconds: {request.target_duration_seconds}
Tone: {request.cinematic_tone}

Generate 10-16 scenes that feel premium, editorial, factual, and visually rich.
""".strip()

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    async def generate_story(self, request: StoryGenerationRequest) -> list[DocumentaryScene]:
        payload = {
            "model": self.select_model(request.language),
            "temperature": 0.35,
            "top_p": 0.9,
            "response_format": {"type": "json_object"},
            "messages": self.build_messages(request),
        }

        headers = {
            "Authorization": f"Bearer {settings.nvidia_nim_api_key.get_secret_value()}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{settings.nvidia_nim_base_url}/chat/completions",
                json=payload,
                headers=headers,
            )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"NVIDIA NIM story generation failed: {response.text}",
            )

        content = response.json()["choices"][0]["message"]["content"]
        try:
            parsed = json.loads(content)
            scenes = [DocumentaryScene.model_validate(scene) for scene in parsed["story"]]
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Model returned invalid documentary JSON: {exc}",
            ) from exc

        ordered = sorted(scenes, key=lambda scene: scene.scene_number)
        if [scene.scene_number for scene in ordered] != list(range(1, len(ordered) + 1)):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Model returned a non-chronological scene sequence",
            )
        return ordered
