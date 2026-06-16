"""ElevenLabs narration synthesis with word-level timestamps."""

from __future__ import annotations

import base64
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import logger

ELEVEN_BASE = "https://api.elevenlabs.io/v1"


@dataclass(slots=True)
class NarrationResult:
    audio_path: Path
    timestamps_json: dict[str, Any]


async def synthesize_narration(
    *,
    text: str,
    job_id: uuid.UUID,
    scene_number: int,
    voice_id: str | None = None,
    model_id: str = "eleven_multilingual_v2",
) -> NarrationResult:
    """Generate the narration MP3 + character-level timestamp JSON."""
    if not settings.elevenlabs_api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is not configured.")

    voice = voice_id or settings.elevenlabs_voice_id
    url = f"{ELEVEN_BASE}/text-to-speech/{voice}/with-timestamps"

    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.4,
            "use_speaker_boost": True,
        },
        "output_format": "mp3_44100_128",
    }

    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    audio_b64 = data.get("audio_base64") or data.get("audio")
    if not audio_b64:
        raise RuntimeError(f"ElevenLabs response missing audio: {data.keys()}")

    out_dir = settings.storage_root / str(job_id) / "narration"
    out_dir.mkdir(parents=True, exist_ok=True)
    audio_path = out_dir / f"scene-{scene_number:03d}.mp3"
    audio_path.write_bytes(base64.b64decode(audio_b64))

    timestamps = {
        "characters": data.get("alignment", {}).get("characters", []),
        "character_start_times_seconds": data.get("alignment", {}).get(
            "character_start_times_seconds", []
        ),
        "character_end_times_seconds": data.get("alignment", {}).get(
            "character_end_times_seconds", []
        ),
        "normalized_alignment": data.get("normalized_alignment"),
    }

    logger.info("ElevenLabs narration saved: {}", audio_path)
    return NarrationResult(audio_path=audio_path, timestamps_json=timestamps)
