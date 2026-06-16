from __future__ import annotations

import base64
from pathlib import Path

import aiofiles
import httpx

from app.core.config import Settings
from app.schemas import VoiceoverResult, WordTimestamp


class ElevenLabsClient:
    """Speech synthesis adapter that preserves word-level subtitle timing."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.headers = {
            "xi-api-key": settings.elevenlabs_api_key,
            "Content-Type": "application/json",
        }

    async def synthesize_scene(self, *, scene_number: int, narration_text: str, output_dir: Path) -> VoiceoverResult:
        output_path = output_dir / f"scene-{scene_number:03d}-voice.mp3"
        payload = {
            "text": narration_text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.45,
                "similarity_boost": 0.8,
                "style": 0.35,
                "use_speaker_boost": True,
            },
        }
        endpoint = f"https://api.elevenlabs.io/v1/text-to-speech/{self.settings.elevenlabs_voice_id}/with-timestamps"
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(endpoint, headers=self.headers, json=payload)
        response.raise_for_status()
        payload = response.json()

        audio_base64 = payload.get("audio_base64")
        if not audio_base64:
            raise ValueError("ElevenLabs response did not include audio_base64")

        async with aiofiles.open(output_path, "wb") as file:
            await file.write(base64.b64decode(audio_base64))

        alignment = payload.get("alignment") or payload.get("normalized_alignment") or {}
        words = self._alignment_to_word_timestamps(alignment)
        return VoiceoverResult(scene_number=scene_number, audio_path=str(output_path), word_timestamps=words)

    @staticmethod
    def _alignment_to_word_timestamps(alignment: dict) -> list[WordTimestamp]:
        characters = alignment.get("characters") or []
        starts = alignment.get("character_start_times_seconds") or []
        ends = alignment.get("character_end_times_seconds") or []
        words: list[WordTimestamp] = []
        current = ""
        start_time: float | None = None
        last_end = 0.0

        for character, char_start, char_end in zip(characters, starts, ends, strict=False):
            if character.isspace():
                if current and start_time is not None:
                    words.append(WordTimestamp(word=current, start=start_time, end=last_end))
                current = ""
                start_time = None
                continue
            if start_time is None:
                start_time = float(char_start)
            current += character
            last_end = float(char_end)

        if current and start_time is not None:
            words.append(WordTimestamp(word=current, start=start_time, end=last_end))
        return words
