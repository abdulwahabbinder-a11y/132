"""
LLM Service — generates documentary scripts via NVIDIA NIM.
  • English: meta/llama-3.1-70b-instruct
  • Hindi / Urdu / Roman: qwen/qwen-2.5-72b-instruct
"""

import json
import re
import structlog
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.models.video_project import VideoLanguage

logger = structlog.get_logger()
settings = get_settings()


SYSTEM_PROMPT = """You are an elite documentary scriptwriter in the style of BBC, Vox, and Mighty Monk.
Your scripts are factually verified, deeply compelling, and cinematic.

STRICT OUTPUT FORMAT — respond ONLY with valid JSON (no markdown, no prose):
{
  "title": "string",
  "description": "string (1 sentence synopsis)",
  "scenes": [
    {
      "scene_number": 1,
      "narration_text": "string (60-120 words, engaging documentary narration)",
      "visual_keywords": ["keyword1", "keyword2", "keyword3"],
      "is_abstract_scene": false,
      "is_historical_character": false,
      "character_name": null,
      "location_coordinates": {"lat": 28.6139, "lng": 77.2090, "zoom": 8, "label": "New Delhi, India"}
    }
  ]
}

RULES:
- scene_number is sequential starting from 1
- is_abstract_scene = true for conceptual/philosophical scenes; false for real-world/historical
- is_historical_character = true only when a named historical person appears in the scene
- character_name must be the person's full name or null
- location_coordinates must be {lat, lng, zoom, label} or null if no specific location
- visual_keywords: 3–5 specific, searchable image/video keywords
- narration_text must be rich, authoritative prose suitable for voice-over
"""


def _select_model(language: VideoLanguage) -> str:
    if language in (VideoLanguage.HINDI, VideoLanguage.URDU, VideoLanguage.ROMAN):
        return "qwen/qwen-2.5-72b-instruct"
    return "meta/llama-3.1-70b-instruct"


class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url=settings.NVIDIA_BASE_URL,
            api_key=settings.NVIDIA_API_KEY,
        )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_documentary_script(
        self,
        topic: str,
        language: VideoLanguage = VideoLanguage.ENGLISH,
        style: str = "documentary",
        num_scenes: int = 8,
    ) -> dict:
        model = _select_model(language)
        lang_name = {
            VideoLanguage.ENGLISH: "English",
            VideoLanguage.HINDI: "Hindi",
            VideoLanguage.URDU: "Urdu",
            VideoLanguage.ROMAN: "Roman Urdu",
        }.get(language, "English")

        user_prompt = (
            f"Create a {style} script about: {topic}\n"
            f"Language: {lang_name}\n"
            f"Number of scenes: {num_scenes}\n"
            f"Style references: Vox explainer cinematography, Mighty Monk storytelling depth, BBC documentary pacing.\n"
            f"Ensure chronological narrative arc with a strong hook in scene 1 and a memorable closing in scene {num_scenes}."
        )

        logger.info("llm_service.generate", model=model, topic=topic[:50], language=language)

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=8192,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        script = self._parse_script(raw)
        logger.info("llm_service.generated", scenes=len(script.get("scenes", [])))
        return script

    def _parse_script(self, raw: str) -> dict:
        """Parse and validate the JSON script output."""
        try:
            # Strip any accidental markdown code fences
            cleaned = re.sub(r"```(?:json)?", "", raw).strip()
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error("llm_service.json_parse_error", error=str(exc), raw=raw[:200])
            raise ValueError(f"LLM returned invalid JSON: {exc}")

        scenes = data.get("scenes", [])
        validated_scenes = []
        for i, s in enumerate(scenes, start=1):
            validated_scenes.append({
                "scene_number": s.get("scene_number", i),
                "narration_text": s.get("narration_text", ""),
                "visual_keywords": s.get("visual_keywords", [])[:5],
                "is_abstract_scene": bool(s.get("is_abstract_scene", False)),
                "is_historical_character": bool(s.get("is_historical_character", False)),
                "character_name": s.get("character_name"),
                "location_coordinates": s.get("location_coordinates"),
            })

        return {
            "title": data.get("title", "Untitled Documentary"),
            "description": data.get("description", ""),
            "scenes": validated_scenes,
        }
