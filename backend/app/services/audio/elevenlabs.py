"""ElevenLabs narration synthesis with character-level timestamps.

Uses the ``with-timestamps`` endpoint so we get per-character alignment, which we
collapse into word-level timestamps for burning subtitles in Remotion.
"""

from __future__ import annotations

import base64

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.core.logging import logger
from app.services import storage

_BASE = "https://api.elevenlabs.io/v1"


class ElevenLabsNotConfiguredError(RuntimeError):
    pass


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=30), reraise=True)
async def synthesize(
    text: str,
    *,
    voice_id: str | None = None,
) -> dict:
    """Synthesize narration; returns audio path + word timestamps."""
    if not settings.elevenlabs_api_key:
        raise ElevenLabsNotConfiguredError("ELEVENLABS_API_KEY is not set.")

    voice = voice_id or settings.elevenlabs_voice_id
    url = f"{_BASE}/text-to-speech/{voice}/with-timestamps"
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            url,
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": settings.elevenlabs_model_id,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8},
            },
        )
        resp.raise_for_status()
        data = resp.json()

    audio_bytes = base64.b64decode(data["audio_base64"])
    audio_path = storage.save_bytes(audio_bytes, suffix=".mp3", subdir="narration")
    alignment = data.get("alignment") or data.get("normalized_alignment") or {}
    words = _chars_to_words(alignment)
    logger.info("ElevenLabs synthesized {} chars -> {} words", len(text), len(words))
    return {
        "audio_path": audio_path,
        "audio_url": storage.public_url(audio_path),
        "word_timestamps": words,
        "char_alignment": alignment,
    }


def _chars_to_words(alignment: dict) -> list[dict]:
    """Collapse per-character timestamps into word-level [{word,start,end}]."""
    chars = alignment.get("characters", [])
    starts = alignment.get("character_start_times_seconds", [])
    ends = alignment.get("character_end_times_seconds", [])
    if not chars:
        return []

    words: list[dict] = []
    current = ""
    word_start: float | None = None
    word_end: float = 0.0

    for ch, start, end in zip(chars, starts, ends):
        if ch.isspace():
            if current:
                words.append({"word": current, "start": word_start, "end": word_end})
                current = ""
                word_start = None
            continue
        if word_start is None:
            word_start = start
        current += ch
        word_end = end

    if current:
        words.append({"word": current, "start": word_start, "end": word_end})
    return words
