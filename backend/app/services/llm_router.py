import json
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.story import SUPPORTED_NON_ENGLISH_LANGUAGES, StoryScene

NIM_CHAT_COMPLETIONS_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions"


def choose_model(language: str) -> str:
    return (
        "qwen/qwen-2.5-72b-instruct"
        if language.lower() in SUPPORTED_NON_ENGLISH_LANGUAGES
        else "meta/llama-3.1-70b-instruct"
    )


def build_strict_prompt(topic: str, language: str, tone: str, target_minutes: int) -> str:
    return f"""
You are an expert documentary writer.
Topic: {topic}
Language: {language}
Tone: {tone}
Target duration minutes: {target_minutes}

Return ONLY valid JSON with this exact shape:
{{
  "scenes": [
    {{
      "scene_number": 1,
      "narration_text": "string",
      "visual_keywords": ["keyword1", "keyword2"],
      "is_abstract_scene": false,
      "is_historical_character": true,
      "character_name": "name or null",
      "location_coordinates": {{"lat": 0.0, "lng": 0.0}}
    }}
  ]
}}

Rules:
- Strictly chronological flow from earliest event to latest event.
- scene_number must be sequential integers starting from 1.
- Keep location coordinates realistic when known.
- No markdown, no code fences, JSON only.
"""


async def generate_story_scenes(
    topic: str, language: str, tone: str, target_minutes: int
) -> tuple[str, list[StoryScene]]:
    settings = get_settings()
    model = choose_model(language)
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You output strict JSON only."},
            {"role": "user", "content": build_strict_prompt(topic, language, tone, target_minutes)},
        ],
        "temperature": 0.4,
        "top_p": 0.9,
        "max_tokens": 3500,
    }

    headers = {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(NIM_CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"NIM generation failed: {response.text}",
        )

    response_json: dict[str, Any] = response.json()
    raw_output = response_json["choices"][0]["message"]["content"]

    try:
        parsed = json.loads(raw_output)
        scenes = [StoryScene.model_validate(scene) for scene in parsed["scenes"]]
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse model JSON output",
        ) from exc

    validate_scene_sequence(scenes)
    return model, scenes


def validate_scene_sequence(scenes: list[StoryScene]) -> None:
    expected_scene_number = 1
    for scene in scenes:
        if scene.scene_number != expected_scene_number:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Scene sequence is not strictly chronological/contiguous",
            )
        expected_scene_number += 1
