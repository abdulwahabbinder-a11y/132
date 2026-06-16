"""Scripting router.

Routes English topics to Llama 3.1 70B and Hindi / Urdu / Roman topics to
Qwen 2.5 72B (both via NVIDIA NIM), then validates the model output against the
strict ``StoryScript`` schema.
"""

from __future__ import annotations

import json
import re
from typing import List

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.story import (
    GenerateStoryRequest,
    Language,
    Scene,
    StoryScript,
)
from app.services.nim_client import nim_client
from app.services.scripting.prompts import SYSTEM_PROMPT, build_user_prompt

log = get_logger(__name__)

# Languages routed to the multilingual model (Qwen).
_INTL_LANGUAGES = {Language.hindi, Language.urdu, Language.roman}


def select_model(language: Language) -> str:
    if language in _INTL_LANGUAGES:
        return settings.NIM_LLM_MODEL_INTL
    return settings.NIM_LLM_MODEL_EN


async def generate_script(req: GenerateStoryRequest) -> StoryScript:
    model = select_model(req.language)
    log.info("scripting.start", model=model, language=req.language, topic=req.topic)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": build_user_prompt(
                req.topic, req.target_scene_count, req.style, req.language.value
            ),
        },
    ]

    raw = await nim_client.chat_completion(
        model=model,
        messages=messages,
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    scenes = _parse_and_validate(raw)
    return StoryScript(topic=req.topic, language=req.language, scenes=scenes)


def _parse_and_validate(raw: str) -> List[Scene]:
    payload = _extract_json(raw)
    scene_dicts = payload.get("scenes", [])
    if not isinstance(scene_dicts, list) or not scene_dicts:
        raise ValueError("LLM returned no scenes.")

    scenes: List[Scene] = [Scene.model_validate(s) for s in scene_dicts]

    # Enforce strict chronological, gap-free numbering.
    scenes.sort(key=lambda s: s.scene_number)
    for idx, scene in enumerate(scenes, start=1):
        scene.scene_number = idx
    return scenes


def _extract_json(raw: str) -> dict:
    """Best-effort extraction of the JSON object from the model output."""
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strip ```json fences if present.
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw, re.DOTALL)
    if fenced:
        return json.loads(fenced.group(1))

    # Fall back to the first { ... last } span.
    start, end = raw.find("{"), raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(raw[start : end + 1])

    raise ValueError("Could not parse JSON from LLM output.")
