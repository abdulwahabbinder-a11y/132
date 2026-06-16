"""ElevenLabs narration TTS with character-level timestamps.

Uses the ``/v1/text-to-speech/{voice}/with-timestamps`` endpoint which returns
the audio (base64 mp3) plus a character alignment map. We convert the
character alignment into word-level timestamps for subtitle burn-in.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import get_logger
from app.utils.files import write_bytes

log = get_logger(__name__)

ELEVEN_BASE = "https://api.elevenlabs.io/v1"


@dataclass
class WordTimestamp:
    word: str
    start: float
    end: float


@dataclass
class NarrationResult:
    audio_path: Path
    duration: float
    words: List[WordTimestamp] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "audio_path": str(self.audio_path),
            "duration": self.duration,
            "words": [w.__dict__ for w in self.words],
        }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=20))
async def synthesize(job_id: str, scene_number: int, text: str) -> NarrationResult:
    filename = f"scene_{scene_number:03d}_vo.mp3"

    if not settings.ELEVENLABS_API_KEY:
        log.warning("elevenlabs.mock", scene=scene_number)
        return _mock_narration(job_id, filename, text)

    url = f"{ELEVEN_BASE}/text-to-speech/{settings.ELEVENLABS_VOICE_ID}/with-timestamps"
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            url,
            headers={"xi-api-key": settings.ELEVENLABS_API_KEY, "Content-Type": "application/json"},
            json={
                "text": text,
                "model_id": settings.ELEVENLABS_MODEL_ID,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
        )
        resp.raise_for_status()
        data = resp.json()

    audio_bytes = base64.b64decode(data["audio_base64"])
    audio_path = write_bytes(job_id, filename, audio_bytes)
    words = _chars_to_words(data.get("alignment") or {})
    duration = words[-1].end if words else _estimate_duration(text)
    return NarrationResult(audio_path=audio_path, duration=duration, words=words)


def _chars_to_words(alignment: Dict[str, Any]) -> List[WordTimestamp]:
    chars: List[str] = alignment.get("characters", [])
    starts: List[float] = alignment.get("character_start_times_seconds", [])
    ends: List[float] = alignment.get("character_end_times_seconds", [])
    if not chars:
        return []

    words: List[WordTimestamp] = []
    current = ""
    w_start = starts[0] if starts else 0.0
    w_end = w_start
    for i, ch in enumerate(chars):
        if ch.isspace():
            if current:
                words.append(WordTimestamp(current, w_start, w_end))
                current = ""
            if i + 1 < len(starts):
                w_start = starts[i + 1]
        else:
            if not current and i < len(starts):
                w_start = starts[i]
            current += ch
            if i < len(ends):
                w_end = ends[i]
    if current:
        words.append(WordTimestamp(current, w_start, w_end))
    return words


def _estimate_duration(text: str) -> float:
    # ~2.7 words/sec narration pace.
    return max(1.0, len(text.split()) / 2.7)


def _mock_narration(job_id: str, filename: str, text: str) -> NarrationResult:
    # Tiny silent MP3 header so a real file exists.
    silent = base64.b64decode("SUQzAwAAAAAAAA==")
    audio_path = write_bytes(job_id, filename, silent)
    words: List[WordTimestamp] = []
    t = 0.0
    for w in text.split():
        dur = len(w) / 12 + 0.18
        words.append(WordTimestamp(w, round(t, 2), round(t + dur, 2)))
        t += dur
    return NarrationResult(audio_path=audio_path, duration=round(t, 2), words=words)
