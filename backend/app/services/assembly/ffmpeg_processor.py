"""High-level FFmpeg orchestration: transitions, subtitles, 21:9 encoding."""

from __future__ import annotations

import subprocess
from pathlib import Path

import ffmpeg

from app.core.config import settings
from app.core.logging import logger

DEFAULT_SUB_STYLE = (
    "FontName=Inter,FontSize=22,PrimaryColour=&H00FFFFFF,"
    "OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,"
    "Alignment=2,MarginV=110"
)


def burn_subtitles(
    *,
    video_in: Path,
    srt_path: Path,
    output_path: Path,
    style: str = DEFAULT_SUB_STYLE,
) -> Path:
    """Burn-in center-bottom aligned subtitles using libass."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sub_filter = f"subtitles='{srt_path}':force_style='{style}'"

    (
        ffmpeg.input(str(video_in))
        .output(
            str(output_path),
            vf=sub_filter,
            vcodec="libx264",
            acodec="copy",
            preset="medium",
            crf=18,
            pix_fmt="yuv420p",
        )
        .overwrite_output()
        .run(quiet=True)
    )
    logger.info("Subtitles burned: {}", output_path)
    return output_path


def insert_transition_sfx(
    *,
    video_in: Path,
    transition_points_seconds: list[float],
    sfx_path: Path,
    output_path: Path,
    sfx_gain_db: float = -3.0,
) -> Path:
    """Overlay a whoosh / deep-boom transition sound at each cut."""
    if not transition_points_seconds:
        return video_in

    output_path.parent.mkdir(parents=True, exist_ok=True)
    inputs = ["-i", str(video_in)]
    filter_parts: list[str] = []
    mix_inputs: list[str] = ["[0:a]"]

    for idx, t in enumerate(transition_points_seconds, start=1):
        inputs.extend(["-i", str(sfx_path)])
        label_in = f"{idx}:a"
        label_out = f"sfx{idx}"
        delay_ms = int(t * 1000)
        filter_parts.append(
            f"[{label_in}]adelay={delay_ms}|{delay_ms},volume={sfx_gain_db}dB[{label_out}]"
        )
        mix_inputs.append(f"[{label_out}]")

    filter_parts.append(
        f"{''.join(mix_inputs)}amix=inputs={len(mix_inputs)}:duration=longest:normalize=0[aout]"
    )

    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", ";".join(filter_parts),
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        str(output_path),
    ]
    logger.debug("FFmpeg transition cmd: {}", " ".join(cmd))
    subprocess.run(cmd, check=True, capture_output=True)
    return output_path


def encode_final_21_9(
    *,
    video_in: Path,
    output_path: Path,
    width: int | None = None,
    height: int | None = None,
    fps: int | None = None,
) -> Path:
    """Final encode pass — pad/crop to 21:9 and produce shareable MP4."""
    w = width or settings.output_width
    h = height or settings.output_height
    f = fps or settings.output_fps
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pad_filter = (
        f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps={f}"
    )

    (
        ffmpeg.input(str(video_in))
        .output(
            str(output_path),
            vf=pad_filter,
            vcodec="libx264",
            acodec="aac",
            preset="slow",
            crf=18,
            pix_fmt="yuv420p",
            movflags="+faststart",
            audio_bitrate="192k",
        )
        .overwrite_output()
        .run(quiet=True)
    )
    logger.info("Final 21:9 encode complete: {}", output_path)
    return output_path
