import httpx

from app.core.config import get_settings

settings = get_settings()


class TTSService:
    async def synthesize(self, text: str) -> dict:
        """
        Uses ElevenLabs and requests alignment metadata to support subtitle burn-in.
        """
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
        headers = {"xi-api-key": settings.elevenlabs_api_key, "Content-Type": "application/json"}
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "output_format": "mp3_44100_128",
            "voice_settings": {"stability": 0.35, "similarity_boost": 0.85},
            "timestamps": True,
        }
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
