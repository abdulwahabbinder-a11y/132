import base64
from pathlib import Path

import aiofiles
import httpx

from app.core.config import get_settings

settings = get_settings()


class ElevenLabsNarrationService:
    async def synthesize_with_timestamps(self, text: str, destination_dir: Path) -> dict:
        headers = {
            "xi-api-key": settings.elevenlabs_api_key.get_secret_value(),
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.35, "similarity_boost": 0.8, "style": 0.35},
        }

        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}/with-timestamps",
                headers=headers,
                json=payload,
            )
        response.raise_for_status()
        response_json = response.json()

        audio_path = destination_dir / "narration.mp3"
        destination_dir.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(audio_path, "wb") as file_handle:
            await file_handle.write(base64.b64decode(response_json["audio_base64"]))

        return {
            "audio_path": str(audio_path),
            "characters": response_json.get("alignment", {}).get("characters", []),
            "character_start_times_seconds": response_json.get("alignment", {}).get(
                "character_start_times_seconds", []
            ),
            "character_end_times_seconds": response_json.get("alignment", {}).get(
                "character_end_times_seconds", []
            ),
        }
