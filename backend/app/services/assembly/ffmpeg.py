"""FFmpeg post-processing: audio ducking + transition SFX.

Two responsibilities:

1. Sidechain-compress (duck) the background music by ~85% whenever the ElevenLabs
   narration track is active.
2. Mix in transition sound effects (whoosh / deep boom) at scene boundaries.

These run as subprocess calls so we can use the full FFmpeg filtergraph syntax,
which the python bindings don't fully cover for sidechaincompress.
"""

from __future__ import annotations

import asyncio
import shlex

from app.core.logging import logger
from app.services import storage

# 85% reduction ≈ -16 dB. sidechaincompress ratio/threshold tuned for narration.
_DUCK_RATIO = 8
_DUCK_THRESHOLD = 0.03


async def _run(cmd: str) -> None:
    logger.debug("ffmpeg: {}", cmd)
    proc = await asyncio.create_subprocess_exec(
        *shlex.split(cmd),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {stderr.decode()[-800:]}")


async def duck_background_music(
    *,
    narration_path: str,
    music_path: str,
    out_suffix: str = ".m4a",
) -> str:
    """Duck music under narration using sidechain compression; return mixed audio."""
    out = storage.save_bytes(b"", suffix=out_suffix, subdir="audio_mix")
    cmd = (
        f'ffmpeg -y -i "{music_path}" -i "{narration_path}" '
        f'-filter_complex "[0:a]volume=0.6[bg];'
        f"[bg][1:a]sidechaincompress=threshold={_DUCK_THRESHOLD}:"
        f"ratio={_DUCK_RATIO}:attack=5:release=250[ducked];"
        f'[ducked][1:a]amix=inputs=2:duration=longest:weights=1 1[out]" '
        f'-map "[out]" -c:a aac -b:a 192k "{out}"'
    )
    await _run(cmd)
    return out


async def insert_transition_sfx(
    *,
    video_path: str,
    sfx_path: str,
    timestamps: list[float],
    out_suffix: str = ".mp4",
) -> str:
    """Overlay a transition SFX at each scene boundary timestamp."""
    out = storage.save_bytes(b"", suffix=out_suffix, subdir="sfx_mix")
    delays = "".join(
        f"[2:a]adelay={int(ts * 1000)}|{int(ts * 1000)}[sfx{i}];"
        for i, ts in enumerate(timestamps)
    )
    sfx_labels = "".join(f"[sfx{i}]" for i in range(len(timestamps)))
    mix = (
        f"[1:a]{sfx_labels}amix=inputs={len(timestamps) + 1}:duration=first[aout]"
        if timestamps
        else "[1:a]anull[aout]"
    )
    cmd = (
        f'ffmpeg -y -i "{video_path}" -i "{video_path}" -i "{sfx_path}" '
        f'-filter_complex "{delays}{mix}" '
        f'-map 0:v -map "[aout]" -c:v copy -c:a aac "{out}"'
    )
    await _run(cmd)
    return out


async def finalize_aspect_ratio(
    *,
    video_path: str,
    aspect: str = "21:9",
    width: int = 2560,
    height: int = 1097,
) -> str:
    """Pad/crop the final render to a clean cinematic 21:9 MP4."""
    out = storage.save_bytes(b"", suffix=".mp4", subdir="final")
    cmd = (
        f'ffmpeg -y -i "{video_path}" '
        f'-vf "scale={width}:{height}:force_original_aspect_ratio=decrease,'
        f'pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black" '
        f'-c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k "{out}"'
    )
    await _run(cmd)
    return out
