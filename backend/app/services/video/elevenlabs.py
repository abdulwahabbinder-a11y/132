import base64
import json
import logging
from pathlib import Path
from typing import Any

import httpx

from app.services.settings_service import get_platform_setting

logger = logging.getLogger(__name__)


class ElevenLabsService:
    def __init__(self):
        self.base_url = "https://api.elevenlabs.io/v1"

    async def synthesize_with_timestamps(
        self,
        text: str,
        output_path: Path,
        timestamps_path: Path | None = None,
    ) -> dict[str, Any]:
        api_key = get_platform_setting("elevenlabs_api_key")
        voice_id = get_platform_setting("elevenlabs_voice_id", "21m00Tcm4TlvDq8ikWAM")

        if not api_key:
            raise ValueError("ElevenLabs API key is not configured")

        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        }

        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.3,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}/with-timestamps",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            logger.error("ElevenLabs request failed: %s", exc)
            raise RuntimeError(f"ElevenLabs synthesis failed: {exc}") from exc

        audio_b64 = data.get("audio_base64", "")
        if not audio_b64:
            raise ValueError("ElevenLabs response did not include audio data")

        alignment = data.get("alignment", {})
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(base64.b64decode(audio_b64))

        word_timestamps = self._extract_word_timestamps(alignment)

        if timestamps_path:
            timestamps_path.write_text(json.dumps(word_timestamps, indent=2))

        logger.info("Synthesized narration (%d words) to %s", len(word_timestamps), output_path)
        return {
            "audio_path": str(output_path),
            "timestamps_path": str(timestamps_path) if timestamps_path else None,
            "word_timestamps": word_timestamps,
            "duration_seconds": word_timestamps[-1]["end"] if word_timestamps else 0,
        }

    def _extract_word_timestamps(self, alignment: dict) -> list[dict[str, Any]]:
        characters = alignment.get("characters", [])
        char_starts = alignment.get("character_start_times_seconds", [])
        char_ends = alignment.get("character_end_times_seconds", [])

        if not characters:
            return []

        words: list[dict[str, Any]] = []
        current_word = ""
        word_start = 0.0

        for i, char in enumerate(characters):
            if char == " ":
                if current_word:
                    words.append(
                        {
                            "word": current_word,
                            "start": word_start,
                            "end": char_starts[i] if i < len(char_starts) else word_start,
                        }
                    )
                    current_word = ""
            else:
                if not current_word:
                    word_start = char_starts[i] if i < len(char_starts) else 0.0
                current_word += char

        if current_word:
            words.append(
                {
                    "word": current_word,
                    "start": word_start,
                    "end": char_ends[-1] if char_ends else word_start,
                }
            )

        return words
