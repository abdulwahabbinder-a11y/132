import base64
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

ELEVENLABS_TTS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech"
NIM_CHAT_COMPLETIONS_ENDPOINT = "https://integrate.api.nvidia.com/v1/video/generations"


async def generate_voiceover_with_timestamps(
    text: str, output_dir: Path, scene_number: int
) -> tuple[Path, Path]:
    settings = get_settings()
    headers = {"xi-api-key": settings.elevenlabs_api_key, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.35, "similarity_boost": 0.9},
        "output_format": "mp3_44100_128",
    }
    endpoint = f"{ELEVENLABS_TTS_ENDPOINT}/EXAVITQu4vr4xnSDxMaL/with-timestamps"
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(endpoint, headers=headers, json=payload)
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ElevenLabs generation failed: {response.text}",
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    audio_path = output_dir / f"scene-{scene_number:02d}.mp3"
    timestamps_path = output_dir / f"scene-{scene_number:02d}-timestamps.json"
    data = response.json()
    audio_blob = data.get("audio_base64", "")
    audio_path.write_bytes(base64.b64decode(audio_blob) if audio_blob else b"")
    timestamps_path.write_text(response.text, encoding="utf-8")
    return audio_path, timestamps_path


async def animate_static_image_to_video(image_url: str, prompt: str, scene_number: int, output_dir: Path) -> Path:
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "nvidia/anyflow-wan2.1-t2v-14b",
        "prompt": prompt,
        "image": image_url,
        "duration_seconds": 4,
        "resolution": "1920x1080",
    }
    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(NIM_CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Wan2.1 animation failed: {response.text}",
        )
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"scene-{scene_number:02d}-animated.json"
    output_path.write_text(response.text, encoding="utf-8")
    return output_path


async def run_liveportrait_lipsync(image_asset_url: str, audio_path: Path, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "liveportrait-output.json"
    payload = {
        "image_asset_url": image_asset_url,
        "audio_file": str(audio_path),
        "engine": "LivePortrait",
        "mode": "high-fidelity",
    }
    output_path.write_text(str(payload), encoding="utf-8")
    return output_path


async def run_deepvideo_v1_neural_render(character_video_source: Path, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "deepvideo-v1-output.json"
    payload: dict[str, Any] = {
        "input": str(character_video_source),
        "pipeline": "DeepVideo-V1",
        "options": {
            "micro_expression_consistency": "max",
            "temporal_stability": "high",
            "anti_flicker": True,
            "realism_boost": 0.95,
        },
    }
    output_path.write_text(str(payload), encoding="utf-8")
    return output_path
