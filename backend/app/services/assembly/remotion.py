"""Remotion render bridge.

Serialises the assembled timeline (scenes, clips, audio, word timestamps, map
coordinates) into an input-props JSON and invokes the Remotion CLI to render the
``Documentary`` composition to MP4.

The Remotion project lives in ``/remotion`` at the repo root. We point the CLI at
its entry file and pass our props via ``--props``.
"""

from __future__ import annotations

import asyncio
import json
import shlex
from pathlib import Path

from app.core.logging import logger
from app.models.video import Video
from app.services import storage

# Resolve repo-root/remotion relative to this file (backend/app/services/assembly).
_REMOTION_DIR = Path(__file__).resolve().parents[4] / "remotion"
_COMPOSITION_ID = "Documentary"


def build_input_props(video: Video, *, mapbox_token: str) -> dict:
    """Construct the props consumed by the Remotion ``Documentary`` composition."""
    return {
        "title": video.topic,
        "language": video.language,
        "mapboxToken": mapbox_token,
        "scenes": [
            {
                "sceneNumber": s.scene_number,
                "narration": s.narration_text,
                "clipUrl": s.clip_url,
                "audioUrl": s.audio_url,
                "wordTimestamps": s.word_timestamps,
                "mediaAssets": s.media_assets,
                "locationCoordinates": s.location_coordinates,
                "isHistoricalCharacter": s.is_historical_character,
                "characterName": s.character_name,
            }
            for s in video.scenes
        ],
    }


async def render(video: Video, *, mapbox_token: str) -> str:
    """Render the documentary via the Remotion CLI; return the output MP4 path."""
    props = build_input_props(video, mapbox_token=mapbox_token)
    props_path = storage.save_bytes(
        json.dumps(props, indent=2).encode(), suffix=".json", subdir="remotion_props"
    )
    out_path = storage.save_bytes(b"", suffix=".mp4", subdir="remotion_out")

    cmd = (
        f"npx remotion render src/index.ts {_COMPOSITION_ID} "
        f'"{out_path}" --props="{props_path}" --codec=h264'
    )
    logger.info("Rendering Remotion composition -> {}", out_path)
    proc = await asyncio.create_subprocess_exec(
        *shlex.split(cmd),
        cwd=str(_REMOTION_DIR),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"Remotion render failed: {stderr.decode()[-1200:]}")
    return out_path
