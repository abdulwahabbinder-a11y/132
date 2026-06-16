"""ElevenLabs TTS — returns MP3 + character-level timestamps JSON."""

from __future__ import annotations

import base64
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


@dataclass
class TTSResult:
    mp3_path: Path
    char_timestamps: List[Dict[str, Any]]   # [{char, start_s, end_s}, ...]
    word_timestamps: List[Dict[str, Any]]   # derived; [{word, start_s, end_s}, ...]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=20), reraise=True)
async def synthesize(
    *,
    text: str,
    out_path: Path,
    voice_id: str | None = None,
    model_id: str | None = None,
) -> TTSResult:
    if not settings.elevenlabs_api_key:
        raise RuntimeError("ELEVENLABS_API_KEY not configured.")

    voice = voice_id or settings.elevenlabs_voice_id
    model = model_id or settings.elevenlabs_model_id
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps"

    payload = {
        "text": text,
        "model_id": model,
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.85,
            "style": 0.25,
            "use_speaker_boost": True,
        },
    }
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    logger.info("ElevenLabs TTS ({} chars) → {}", len(text), out_path.name)
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(url, json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()

    audio_b64 = data["audio_base64"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(audio_b64))

    align = data.get("alignment") or {}
    chars = align.get("characters") or []
    starts = align.get("character_start_times_seconds") or []
    ends = align.get("character_end_times_seconds") or []
    char_ts = [
        {"char": ch, "start_s": s, "end_s": e}
        for ch, s, e in zip(chars, starts, ends)
    ]
    word_ts = _aggregate_words(char_ts)
    return TTSResult(mp3_path=out_path, char_timestamps=char_ts, word_timestamps=word_ts)


def _aggregate_words(char_ts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group character-level timestamps into words for subtitle burn-in."""
    words: list[dict] = []
    cur: list[dict] = []
    for c in char_ts:
        if c["char"].isspace():
            if cur:
                words.append(
                    {
                        "word": "".join(x["char"] for x in cur),
                        "start_s": cur[0]["start_s"],
                        "end_s": cur[-1]["end_s"],
                    }
                )
                cur = []
        else:
            cur.append(c)
    if cur:
        words.append(
            {
                "word": "".join(x["char"] for x in cur),
                "start_s": cur[0]["start_s"],
                "end_s": cur[-1]["end_s"],
            }
        )
    return words
