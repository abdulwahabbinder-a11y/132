import json
import logging
import re
from typing import Any

import httpx

from app.schemas.short import ViralScene, ViralScript
from app.services.llm.claude_client import ClaudeClient
from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)

LLAMA_MODEL = "meta/llama-3.1-70b-instruct"

VIRAL_SYSTEM_PROMPT = """You are a viral short-form video scriptwriter (TikTok/Reels/Shorts style).
Create high-retention scripts with strong hooks, fast pacing, and punchy narration.

Output valid JSON only:
{
  "title": "Catchy video title",
  "hook": "First 2-second attention grabber",
  "total_duration_seconds": 60,
  "scenes": [
    {
      "scene_number": 1,
      "narration_text": "Spoken narration for this scene",
      "image_prompt": "Detailed photorealistic image prompt for Flux",
      "on_screen_text": "Bold on-screen caption",
      "duration_seconds": 4
    }
  ]
}

Rules:
- Open with an irresistible hook in scene 1
- 8-15 scenes, 3-5 seconds each
- image_prompt: vivid, vertical-friendly, no text in image
- on_screen_text: short punchy captions (max 8 words)
- narration_text: conversational, urgent, curiosity-driven
- Return ONLY JSON, no markdown fences"""


class ViralScriptGenerator:
    def __init__(self):
        self.claude = ClaudeClient()

    async def generate(
        self,
        topic: str,
        scraped_text: str,
        target_duration_seconds: int = 60,
        research_brief: dict[str, Any] | None = None,
    ) -> ViralScript:
        script_llm = get_platform_setting("script_llm", "claude_then_llama")

        if script_llm == "claude":
            return await self._generate_claude(topic, research_brief or {}, target_duration_seconds, scraped_text)
        if script_llm == "llama":
            return await self._generate_llama(topic, scraped_text, target_duration_seconds, research_brief)
        # claude_then_llama: Claude drafts, Llama polishes
        try:
            claude_script = await self._generate_claude(topic, research_brief or {}, target_duration_seconds, scraped_text)
            return claude_script
        except Exception as exc:
            logger.warning("Claude script failed, falling back to Llama: %s", exc)
            return await self._generate_llama(topic, scraped_text, target_duration_seconds, research_brief)

    async def _generate_claude(
        self,
        topic: str,
        research_brief: dict[str, Any],
        target_duration_seconds: int,
        scraped_text: str,
    ) -> ViralScript:
        if not research_brief:
            research_brief = await self.claude.research_synthesis(topic, scraped_text)

        raw = await self.claude.generate_viral_script(topic, research_brief, target_duration_seconds)
        parsed = self._parse_json(raw)
        return self._build_script(parsed, topic, target_duration_seconds)

    async def _generate_llama(
        self,
        topic: str,
        scraped_text: str,
        target_duration_seconds: int,
        research_brief: dict[str, Any] | None,
    ) -> ViralScript:
        api_key = get_platform_setting("nvidia_nim_api_key")
        base_url = get_platform_setting("nvidia_nim_base_url") or "https://integrate.api.nvidia.com/v1"
        if not api_key:
            raise ValueError("NVIDIA NIM API key not configured.")

        scene_count = max(8, target_duration_seconds // 4)
        context = scraped_text[:20000]
        if research_brief:
            context = json.dumps(research_brief, indent=2)[:15000] + "\n\n" + context[:10000]

        user_prompt = f"""Topic: {topic}
Target duration: {target_duration_seconds} seconds (~{scene_count} scenes)

RESEARCH DATA:
{context}

Write a viral short script using the real data above."""

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": LLAMA_MODEL,
            "messages": [
                {"role": "system", "content": VIRAL_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.8,
            "max_tokens": 4096,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            raw = response.json()["choices"][0]["message"]["content"]

        parsed = self._parse_json(raw)
        return self._build_script(parsed, topic, target_duration_seconds)

    def _build_script(self, parsed: dict, topic: str, target_duration_seconds: int) -> ViralScript:
        scenes = [
            ViralScene(
                scene_number=s.get("scene_number", i + 1),
                narration_text=s["narration_text"],
                image_prompt=s["image_prompt"],
                on_screen_text=s.get("on_screen_text"),
                duration_seconds=float(s.get("duration_seconds", 4)),
            )
            for i, s in enumerate(parsed.get("scenes", []))
        ]
        return ViralScript(
            title=parsed.get("title", f"Viral: {topic}"),
            hook=parsed.get("hook", ""),
            topic=topic,
            total_duration_seconds=float(parsed.get("total_duration_seconds", target_duration_seconds)),
            scenes=scenes,
        )

    def _parse_json(self, raw: str) -> dict[str, Any]:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        return json.loads(cleaned)
