import logging

from app.schemas.story import StoryScript
from app.services.llm.nim_client import (
    STORY_SYSTEM_PROMPT,
    NvidiaNIMClient,
    _build_story,
    _parse_scenes_json,
)

logger = logging.getLogger(__name__)

LLAMA_MODEL = "meta/llama-3.1-70b-instruct"
QWEN_MODEL = "qwen/qwen-2.5-72b-instruct"

HINDI_URDU_ROMAN = {"hi", "ur", "roman"}


class StoryGenerationRouter:
    def __init__(self):
        self.llama = NvidiaNIMClient(LLAMA_MODEL)
        self.qwen = NvidiaNIMClient(QWEN_MODEL)

    def _select_client(self, language: str) -> NvidiaNIMClient:
        if language.lower() in HINDI_URDU_ROMAN:
            logger.info("Routing to Qwen 2.5 for language=%s", language)
            return self.qwen
        logger.info("Routing to Llama 3.1 for language=%s", language)
        return self.llama

    async def generate(
        self,
        topic: str,
        language: str = "en",
        duration_minutes: int = 5,
        style: str = "vox",
    ) -> StoryScript:
        client = self._select_client(language)
        scene_count = max(5, duration_minutes * 2)

        style_guide = {
            "vox": "Vox-style explainer with data-driven hooks and clean transitions",
            "mighty_monk": "Mighty Monk style with dramatic pacing and philosophical depth",
            "bbc": "BBC documentary gravitas with authoritative narration",
        }

        user_prompt = f"""Topic: {topic}
Language: {language}
Target duration: {duration_minutes} minutes (~{scene_count} scenes)
Style: {style_guide.get(style, style_guide['vox'])}

Generate exactly {scene_count} scenes in strict chronological order."""

        raw = await client.chat_completion(STORY_SYSTEM_PROMPT, user_prompt)
        scenes_data = _parse_scenes_json(raw)
        return _build_story(topic, language, scenes_data)
