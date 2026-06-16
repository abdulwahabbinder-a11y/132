"""Routes a story request to the correct NIM model and validates the JSON."""

from __future__ import annotations

from app.core.config import settings
from app.core.logging import logger
from app.schemas.scene import StoryScript
from app.schemas.story import GenerateStoryRequest

from .language_detector import detect_language
from .nim_client import NimChatClient
from .prompts import SYSTEM_PROMPT_EN, SYSTEM_PROMPT_MULTILANG, user_prompt


def _pick_model(language: str) -> str:
    if language == "en":
        return settings.nim_model_en
    return settings.nim_model_hi


def _pick_system_prompt(language: str) -> str:
    return SYSTEM_PROMPT_EN if language == "en" else SYSTEM_PROMPT_MULTILANG


async def generate_story_script(req: GenerateStoryRequest) -> StoryScript:
    """Generate, parse, and validate a chronological documentary script."""
    language = req.language or detect_language(req.topic)
    model = _pick_model(language)
    system_prompt = _pick_system_prompt(language)
    user_msg = user_prompt(
        topic=req.topic,
        target_duration_seconds=req.target_duration_seconds,
        style=req.style,
        language=language,
    )

    logger.info("Routing story to {} (lang={})", model, language)

    async with NimChatClient() as client:
        raw = await client.json_completion(
            model=model,
            system_prompt=system_prompt,
            user_prompt=user_msg,
            temperature=0.35,
            max_tokens=6000,
        )

    raw.setdefault("topic", req.topic)
    raw.setdefault("language", language)
    raw["model"] = model

    return StoryScript.model_validate(raw)
