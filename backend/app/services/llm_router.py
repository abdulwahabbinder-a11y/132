"""LLM scripting router — chooses Llama 3.1 (English) vs Qwen 2.5
(Hindi/Urdu/Roman) on NVIDIA NIM and enforces our strict scene-JSON schema.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
from loguru import logger
from pydantic import ValidationError
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.schemas.story import Language, Script

# ---------------------------------------------------------------- Prompting ---

SYSTEM_PROMPT_TEMPLATE = """You are a world-class documentary screenwriter for a YouTube channel that
fuses the contemplative pacing of "Mighty Monk" with the rigorous, source-driven
explainer style of Vox. Produce a high-retention shooting script.

Hard requirements:
- The output MUST be a single valid JSON object — no markdown, no preface.
- Scenes must be strictly chronological and form a single coherent narrative.
- 25–45 scenes total; each narration_text is 2–5 sentences (~12s of speech).
- `visual_keywords`: 3–6 concrete, photographable nouns/phrases (no abstractions).
- `is_abstract_scene` = true ONLY when the moment cannot be filmed
  (emotion, metaphor, philosophy, future speculation).
- `is_historical_character` = true ONLY when the scene focuses on a real,
  named, publicly-known person; also set `character_name`.
- `location_coordinates` = [longitude, latitude] when the scene is tied to a
  real place; otherwise null. Use precise coordinates (4 decimals).
- Tone: {tone}. Language: {language}.

Output JSON schema:
{{
  "title": "string",
  "language": "{language}",
  "topic": "string",
  "estimated_duration_seconds": int,
  "scenes": [
    {{
      "scene_number": int,
      "narration_text": "string",
      "visual_keywords": ["string"],
      "is_abstract_scene": bool,
      "is_historical_character": bool,
      "character_name": "string|null",
      "location_coordinates": [lng, lat] | null
    }}
  ]
}}
"""


def _pick_model(language: Language) -> str:
    """English → Llama 3.1 70B. Hindi/Urdu/Roman → Qwen 2.5 72B."""
    if language == "english":
        return settings.nim_model_llama
    return settings.nim_model_qwen


# ---------------------------------------------------------- NVIDIA NIM call ---


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    reraise=True,
)
async def _nim_chat(model: str, messages: list[dict[str, str]], *, temperature: float = 0.6) -> str:
    """Low-level call to NVIDIA NIM chat-completions endpoint."""
    if not settings.nvidia_nim_api_key:
        raise RuntimeError("NVIDIA_NIM_API_KEY not configured.")

    url = f"{settings.nvidia_nim_base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Accept": "application/json",
    }
    body: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "top_p": 0.9,
        "max_tokens": 8192,
        "response_format": {"type": "json_object"},
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=180) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()

    return data["choices"][0]["message"]["content"]


# ---------------------------------------------------------------- Public API ---


async def generate_script(
    *,
    topic: str,
    language: Language,
    tone: str,
    target_duration_seconds: int,
) -> Script:
    """Produce a validated `Script` object for the given topic."""
    model = _pick_model(language)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(tone=tone, language=language)
    user_prompt = (
        f"Topic: {topic}\n"
        f"Target duration: {target_duration_seconds} seconds.\n"
        f"Return ONLY the JSON object."
    )

    logger.info("LLM scripting topic='{}' lang={} via model={}", topic, language, model)
    raw = await _nim_chat(
        model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    try:
        parsed = json.loads(raw)
        return Script.model_validate(parsed)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.error("LLM returned malformed JSON: {}", exc)
        logger.debug("Raw payload: {}", raw[:1000])
        raise RuntimeError("LLM script JSON failed schema validation.") from exc
