import json
import logging
import re
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)

RESEARCH_SYSTEM = """You are an elite research analyst for viral video production.
Synthesize the provided multi-source web research into a comprehensive research brief.

Output valid JSON:
{
  "title": "Compelling video title",
  "key_facts": ["fact 1", "fact 2", ...],
  "hook_angles": ["angle 1", "angle 2"],
  "timeline": ["chronological point 1", ...],
  "controversies_or_debates": ["point 1"],
  "visual_keywords": ["keyword1", "keyword2"],
  "summary": "2-3 paragraph synthesis of all research for scriptwriting",
  "sources_used": ["source names"]
}

Be factual, cite patterns across sources, highlight the most viral-worthy angles.
Return ONLY JSON."""


class ClaudeClient:
    def __init__(self):
        self.base_url = "https://api.anthropic.com/v1/messages"

    async def research_synthesis(self, topic: str, scraped_text: str) -> dict[str, Any]:
        api_key = get_platform_setting("claude_api_key")
        model = get_platform_setting("claude_model", "claude-sonnet-4-20250514")
        if not api_key:
            raise ValueError("Claude API key not configured in Admin Dashboard")

        user_prompt = f"""Topic: {topic}

MULTI-SOURCE RESEARCH DATA:
{scraped_text[:45000]}

Synthesize this into a research brief optimized for a viral short-form video."""

        raw = await self._chat(api_key, model, RESEARCH_SYSTEM, user_prompt, temperature=0.4)
        return self._parse_json(raw)

    async def generate_viral_script(
        self,
        topic: str,
        research_brief: dict[str, Any],
        target_duration_seconds: int = 60,
    ) -> str:
        api_key = get_platform_setting("claude_api_key")
        model = get_platform_setting("claude_model", "claude-sonnet-4-20250514")
        if not api_key:
            raise ValueError("Claude API key not configured")

        scene_count = max(8, target_duration_seconds // 4)
        system = """You are a viral short-form video scriptwriter (TikTok/Reels/Shorts).
Output valid JSON only:
{
  "title": "Catchy title",
  "hook": "2-second attention grabber",
  "total_duration_seconds": 60,
  "scenes": [
    {
      "scene_number": 1,
      "narration_text": "Spoken narration",
      "image_prompt": "Photorealistic vertical image prompt for Flux, no text",
      "on_screen_text": "BOLD CAPTION",
      "duration_seconds": 4
    }
  ]
}
Return ONLY JSON."""

        user_prompt = f"""Topic: {topic}
Duration: {target_duration_seconds}s (~{scene_count} scenes)

RESEARCH BRIEF:
{json.dumps(research_brief, indent=2)[:15000]}

Write a high-retention viral script using the real facts above."""

        return await self._chat(api_key, model, system, user_prompt, temperature=0.85)

    async def _chat(
        self,
        api_key: str,
        model: str,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user}],
            "temperature": temperature,
        }

        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("content", [])
        if content and content[0].get("type") == "text":
            return content[0]["text"]
        raise ValueError("Unexpected Claude response format")

    def _parse_json(self, raw: str) -> dict[str, Any]:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        return json.loads(cleaned)
