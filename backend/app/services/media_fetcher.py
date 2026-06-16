from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

NIM_IMAGE_ENDPOINT = "https://integrate.api.nvidia.com/v1/images/generations"


async def generate_flux_image(prompt: str, output_dir: Path, scene_number: int) -> Path:
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "stabilityai/flux-1-dev",
        "prompt": prompt,
        "response_format": "b64_json",
        "size": "1920x1080",
    }

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(NIM_IMAGE_ENDPOINT, headers=headers, json=payload)
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Flux generation failed: {response.text}",
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"scene-{scene_number:02d}-flux.json"
    output_path.write_text(response.text, encoding="utf-8")
    return output_path


async def download_binary_asset(url: str, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        response = await client.get(url)
    response.raise_for_status()
    output_path.write_bytes(response.content)
    return output_path


def pick_best_stock_video(videos: list[dict[str, Any]]) -> str | None:
    if not videos:
        return None
    first = videos[0]
    video_files = first.get("video_files", [])
    if video_files:
        return video_files[0].get("link")
    return first.get("videos", {}).get("medium", {}).get("url")
