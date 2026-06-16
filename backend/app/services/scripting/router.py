"""Scripting router.

Routes the scripting request to the correct NIM LLM based on language:
  * English          -> meta/llama-3.1-70b-instruct
  * Hindi/Urdu/Roman -> qwen/qwen-2.5-72b-instruct

Returns a validated :class:`StoryScript` with strict chronological scenes.
"""

from __future__ import annotations

import json
import re

from app.config import settings
from app.core.logging import logger
from app.models.video import Scene
from app.schemas.story import (
    GenerateStoryRequest,
    ScriptLanguage,
    StoryScript,
)
from app.services.ai.nim_client import NIMClient, get_nim_client
from app.services.scripting.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

# English uses Llama; every other supported language uses Qwen (better multilingual
# coverage for Hindi/Urdu/Roman scripts).
_QWEN_LANGUAGES = {
    ScriptLanguage.HINDI,
    ScriptLanguage.URDU,
    ScriptLanguage.ROMAN,
}


def select_model(language: ScriptLanguage) -> str:
    if language in _QWEN_LANGUAGES:
        return settings.nim_model_qwen
    return settings.nim_model_llama


class ScriptingRouter:
    def __init__(self, nim: NIMClient | None = None) -> None:
        self.nim = nim or get_nim_client()

    async def generate(self, request: GenerateStoryRequest) -> StoryScript:
        model = select_model(request.language)
        logger.info(
            "Scripting '{}' in {} via {}", request.topic, request.language, model
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": USER_PROMPT_TEMPLATE.format(
                    scene_count=request.target_scene_count,
                    topic=request.topic,
                    language=request.language.value,
                    style_reference=request.style_reference,
                ),
            },
        ]

        raw = await self.nim.chat_completion(
            model=model,
            messages=messages,
            temperature=0.8,
            max_tokens=6000,
            response_format={"type": "json_object"},
        )
        return self._parse(raw, request.language)

    def _parse(self, raw: str, language: ScriptLanguage) -> StoryScript:
        data = _extract_json(raw)
        scenes = [Scene(**s) for s in data.get("scenes", [])]
        scenes.sort(key=lambda s: s.scene_number)  # enforce chronology
        for index, scene in enumerate(scenes, start=1):
            scene.scene_number = index
        return StoryScript(
            title=data.get("title", "Untitled Documentary"),
            language=language,
            scenes=scenes,
        )


def _extract_json(raw: str) -> dict:
    """Best-effort extraction of a JSON object from an LLM response."""
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            raise ValueError("Scripting model did not return JSON.")
        return json.loads(match.group(0))


def get_scripting_router() -> ScriptingRouter:
    return ScriptingRouter()
