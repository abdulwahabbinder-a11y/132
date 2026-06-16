"""
ElevenLabs TTS Service.
  • Converts narration text to MP3
  • Captures character-level word timestamps for subtitle burn-in
"""

import os
import json
import structlog
import aiohttp
import aiofiles
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"


class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.voice_id = settings.ELEVENLABS_VOICE_ID
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        Path(settings.ASSETS_DIR).mkdir(parents=True, exist_ok=True)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def synthesize_narration(
        self,
        text: str,
        project_id: str,
        scene_number: int | None = None,
    ) -> dict:
        """
        Generate voice-over audio for narration text.
        Returns dict with 'audio_path' and 'word_timestamps'.
        """
        suffix = f"scene_{scene_number}" if scene_number else "full"
        audio_path = os.path.join(settings.ASSETS_DIR, f"{project_id}_{suffix}.mp3")
        timestamps_path = os.path.join(settings.ASSETS_DIR, f"{project_id}_{suffix}_timestamps.json")

        payload = {
            "text": text,
            "model_id": "eleven_turbo_v2_5",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.85,
                "style": 0.3,
                "use_speaker_boost": True,
            },
        }

        # Use /with-timestamps endpoint for word-level alignment
        url = f"{ELEVENLABS_BASE}/text-to-speech/{self.voice_id}/with-timestamps"

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120),
            ) as resp:
                if resp.status != 200:
                    text_body = await resp.text()
                    logger.error("elevenlabs.error", status=resp.status, body=text_body[:200])
                    raise RuntimeError(f"ElevenLabs API error {resp.status}")

                data = await resp.json()

        # audio is base64-encoded
        import base64
        audio_b64 = data.get("audio_base64", "")
        audio_bytes = base64.b64decode(audio_b64)
        async with aiofiles.open(audio_path, "wb") as f:
            await f.write(audio_bytes)

        # Extract word timestamps
        alignment = data.get("alignment", {})
        word_timestamps = self._parse_word_timestamps(alignment)

        async with aiofiles.open(timestamps_path, "w") as f:
            await f.write(json.dumps(word_timestamps, ensure_ascii=False))

        logger.info(
            "elevenlabs.synthesized",
            project=project_id,
            scene=scene_number,
            words=len(word_timestamps),
            audio_path=audio_path,
        )
        return {
            "audio_path": audio_path,
            "word_timestamps": word_timestamps,
            "timestamps_path": timestamps_path,
        }

    def _parse_word_timestamps(self, alignment: dict) -> list[dict]:
        """
        Parse ElevenLabs alignment data into word-level timestamps.
        Returns list of {word, start_ms, end_ms}.
        """
        characters = alignment.get("characters", [])
        char_start = alignment.get("character_start_times_seconds", [])
        char_end = alignment.get("character_end_times_seconds", [])

        if not characters or not char_start:
            return []

        words = []
        current_word = ""
        word_start = None

        for char, start, end in zip(characters, char_start, char_end):
            if char == " " or char == "\n":
                if current_word:
                    words.append({
                        "word": current_word,
                        "start_ms": int(word_start * 1000),
                        "end_ms": int(end * 1000),
                    })
                    current_word = ""
                    word_start = None
            else:
                if not current_word:
                    word_start = start
                current_word += char

        if current_word and word_start is not None:
            words.append({
                "word": current_word,
                "start_ms": int(word_start * 1000),
                "end_ms": int(char_end[-1] * 1000) if char_end else 0,
            })

        return words

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    async def synthesize_full_narration(self, scenes: list[dict], project_id: str) -> dict:
        """
        Synthesize all scene narrations as one combined audio file.
        Returns consolidated word timestamps with scene boundaries.
        """
        full_text = "\n\n".join(s["narration_text"] for s in scenes)
        return await self.synthesize_narration(full_text, project_id, scene_number=None)
