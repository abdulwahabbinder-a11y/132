"""FFmpeg post-processing: audio ducking, transition SFX, subtitle burn-in.

These helpers shell out to the ``ffmpeg`` binary. They are written to be safe to
import even when ffmpeg is missing (calls raise at runtime, not import time).
"""

from __future__ import annotations

import subprocess
from pathlib import Path
from typing import List

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__)


def _run(cmd: List[str]) -> None:
    log.info("ffmpeg.run", cmd=" ".join(cmd))
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        log.error("ffmpeg.failed", stderr=proc.stderr[-2000:])
        raise RuntimeError(f"ffmpeg failed: {proc.stderr[-500:]}")


def duck_music_under_voice(
    voice_track: Path,
    music_track: Path,
    output: Path,
    reduction_db: float = 16.5,  # ~85% reduction in linear amplitude
) -> Path:
    """Sidechain-compress the music so it drops ~85% while narration is active.

    ``sidechaincompress`` keys the music's gain reduction off the voice track's
    envelope, then we mix the ducked music back with the full-volume voice.
    """
    ff = settings.FFMPEG_BINARY
    cmd = [
        ff,
        "-y",
        "-i",
        str(music_track),
        "-i",
        str(voice_track),
        "-filter_complex",
        (
            "[0:a]volume=0.6[music];"
            "[music][1:a]sidechaincompress="
            "threshold=0.03:ratio=20:attack=20:release=400:makeup=1[ducked];"
            "[ducked][1:a]amix=inputs=2:duration=longest:weights=1 1[mix]"
        ),
        "-map",
        "[mix]",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        str(output),
    ]
    _run(cmd)
    return output


def insert_transition_sfx(
    base_audio: Path,
    sfx: Path,
    at_seconds: float,
    output: Path,
) -> Path:
    """Overlay a whoosh / deep-boom SFX at a transition timestamp."""
    ff = settings.FFMPEG_BINARY
    delay_ms = int(at_seconds * 1000)
    cmd = [
        ff,
        "-y",
        "-i",
        str(base_audio),
        "-i",
        str(sfx),
        "-filter_complex",
        f"[1:a]adelay={delay_ms}|{delay_ms}[sfx];[0:a][sfx]amix=inputs=2:duration=first[out]",
        "-map",
        "[out]",
        "-c:a",
        "aac",
        str(output),
    ]
    _run(cmd)
    return output


def burn_in_subtitles(video: Path, srt: Path, output: Path) -> Path:
    """Burn centre-bottom aligned subtitles into the video."""
    ff = settings.FFMPEG_BINARY
    style = (
        "FontName=Inter,FontSize=20,PrimaryColour=&H00FFFFFF,"
        "OutlineColour=&H99000000,BorderStyle=3,Outline=1,Shadow=0,"
        "Alignment=2,MarginV=48"
    )
    cmd = [
        ff,
        "-y",
        "-i",
        str(video),
        "-vf",
        f"subtitles={srt}:force_style='{style}'",
        "-c:a",
        "copy",
        str(output),
    ]
    _run(cmd)
    return output


def mux_audio_video(video: Path, audio: Path, output: Path) -> Path:
    """Combine the final video stream with the mastered audio track."""
    ff = settings.FFMPEG_BINARY
    cmd = [
        ff,
        "-y",
        "-i",
        str(video),
        "-i",
        str(audio),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-shortest",
        str(output),
    ]
    _run(cmd)
    return output


def to_cinematic_2139(video: Path, output: Path) -> Path:
    """Letterbox/crop the final render to a clean 21:9 cinematic frame."""
    ff = settings.FFMPEG_BINARY
    cmd = [
        ff,
        "-y",
        "-i",
        str(video),
        "-vf",
        "scale=2560:1097:force_original_aspect_ratio=increase,crop=2560:1097",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        str(output),
    ]
    _run(cmd)
    return output
