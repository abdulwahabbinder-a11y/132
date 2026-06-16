import base64
from pathlib import Path
from typing import Any

import httpx

from app.core.config import Settings


class ElevenLabsClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = "https://api.elevenlabs.io/v1"

    async def synthesize_with_timestamps(
        self,
        *,
        text: str,
        job_id: str,
        scene_number: int,
    ) -> dict[str, Any]:
        if not self.settings.elevenlabs_api_key or not self.settings.elevenlabs_voice_id:
            return {
                "audio_url": None,
                "timestamps": [],
                "warning": "ElevenLabs credentials are not configured",
            }

        response = await self._request_timestamps(text)
        audio_path = (
            self.settings.render_output_dir
            / job_id
            / "audio"
            / f"scene-{scene_number:03d}.mp3"
        )
        audio_path.parent.mkdir(parents=True, exist_ok=True)
        audio_base64 = response.get("audio_base64") or response.get("audio")
        if audio_base64:
            audio_path.write_bytes(base64.b64decode(audio_base64))

        alignment = response.get("alignment") or response.get("normalized_alignment") or {}
        return {
            "audio_url": str(audio_path),
            "timestamps": self._alignment_to_words(alignment),
            "raw_alignment": alignment,
        }

    async def _request_timestamps(self, text: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/text-to-speech/{self.settings.elevenlabs_voice_id}/with-timestamps",
                headers={
                    "xi-api-key": self.settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.47,
                        "similarity_boost": 0.82,
                        "style": 0.35,
                        "use_speaker_boost": True,
                    },
                },
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    def _alignment_to_words(alignment: dict[str, Any]) -> list[dict[str, Any]]:
        characters = alignment.get("characters") or []
        starts = alignment.get("character_start_times_seconds") or []
        ends = alignment.get("character_end_times_seconds") or []
        words: list[dict[str, Any]] = []
        buffer = ""
        word_start: float | None = None
        word_end: float | None = None

        for index, character in enumerate(characters):
            start = starts[index] if index < len(starts) else None
            end = ends[index] if index < len(ends) else start
            if character.isspace():
                if buffer:
                    words.append({"word": buffer, "start": word_start, "end": word_end})
                    buffer = ""
                    word_start = None
                    word_end = None
                continue
            if word_start is None:
                word_start = start
            word_end = end
            buffer += character

        if buffer:
            words.append({"word": buffer, "start": word_start, "end": word_end})
        return words
