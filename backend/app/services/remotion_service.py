from pathlib import Path
from typing import Any

import httpx

from app.core.config import get_settings


async def render_remotion_composition(project_id: str, composition_props: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    payload = {"project_id": project_id, "composition_props": composition_props}
    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(settings.remotion_render_endpoint, json=payload)
    response.raise_for_status()
    return response.json()


def build_audio_ducking_ffmpeg_command(
    voice_track: Path, bgm_track: Path, sfx_track: Path, rendered_video: Path, output_path: Path
) -> str:
    return (
        "ffmpeg "
        f"-i {rendered_video} -i {voice_track} -i {bgm_track} -i {sfx_track} "
        "-filter_complex "
        "\"[2:a]volume=1.0[bgm];"
        "[1:a]asplit=2[voice][voice_side];"
        "[bgm][voice_side]sidechaincompress=threshold=0.02:ratio=20:attack=15:release=350[ducked];"
        "[ducked]volume=0.15[ducked85];"
        "[ducked85][3:a]amix=inputs=2:duration=longest[mix1];"
        "[mix1][voice]amix=inputs=2:duration=longest[aout]\" "
        "-map 0:v -map \"[aout]\" -c:v copy -c:a aac -shortest "
        f"{output_path}"
    )
