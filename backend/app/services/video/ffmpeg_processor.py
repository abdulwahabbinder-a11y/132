"""FFmpeg post-processing — audio ducking, transition SFX, subtitle burn-in,
and final 21:9 cinematic MP4 export.
"""

from __future__ import annotations

import asyncio
import shlex
from pathlib import Path
from typing import Iterable, List

from loguru import logger

from app.config import settings


async def _run(cmd: str) -> None:
    logger.debug("$ {}", cmd)
    proc = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed (exit {proc.returncode}):\n{stderr.decode(errors='ignore')}"
        )


async def concat_clips(clip_paths: Iterable[Path], out_path: Path) -> Path:
    """Lossless concat using the concat demuxer."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    list_file = out_path.with_suffix(".txt")
    list_file.write_text("\n".join(f"file '{p.as_posix()}'" for p in clip_paths))
    cmd = (
        f"{settings.ffmpeg_bin} -y -f concat -safe 0 -i {shlex.quote(str(list_file))} "
        f"-c copy {shlex.quote(str(out_path))}"
    )
    await _run(cmd)
    return out_path


async def duck_music_under_narration(
    *,
    music_path: Path,
    narration_path: Path,
    out_path: Path,
) -> Path:
    """Sidechain compression: drop music by ~85% (-15 dB) while narration plays."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = (
        f"{settings.ffmpeg_bin} -y "
        f"-i {shlex.quote(str(music_path))} "
        f"-i {shlex.quote(str(narration_path))} "
        f"-filter_complex \""
        f"[1:a]asplit=2[narr][sc];"
        f"[0:a][sc]sidechaincompress=threshold=0.05:ratio=20:attack=20:release=400:makeup=0[ducked];"
        f"[ducked]volume={settings.audio_duck_db}dB[bg];"
        f"[bg][narr]amix=inputs=2:duration=longest:dropout_transition=0,"
        f"loudnorm=I=-16:LRA=11:TP=-1.5\" "
        f"-c:a aac -b:a 192k {shlex.quote(str(out_path))}"
    )
    await _run(cmd)
    return out_path


async def insert_transition_sfx(
    *,
    base_video_path: Path,
    sfx_path: Path,
    timestamps_s: List[float],
    out_path: Path,
) -> Path:
    """Overlay a Whoosh/Deep-Boom at each transition timestamp."""
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Build N delayed copies of the SFX and amix them with the source audio.
    sfx_inputs = " ".join(f"-i {shlex.quote(str(sfx_path))}" for _ in timestamps_s)
    sfx_filters = ";".join(
        f"[{i+1}:a]adelay={int(t*1000)}|{int(t*1000)}[sfx{i}]"
        for i, t in enumerate(timestamps_s)
    )
    mix_inputs = "[0:a]" + "".join(f"[sfx{i}]" for i in range(len(timestamps_s)))
    cmd = (
        f"{settings.ffmpeg_bin} -y -i {shlex.quote(str(base_video_path))} {sfx_inputs} "
        f"-filter_complex \"{sfx_filters};"
        f"{mix_inputs}amix=inputs={len(timestamps_s)+1}:duration=longest:dropout_transition=0[aout]\" "
        f"-map 0:v -map \"[aout]\" -c:v copy -c:a aac -b:a 192k {shlex.quote(str(out_path))}"
    )
    await _run(cmd)
    return out_path


async def burn_subtitles_and_export_cinematic(
    *,
    video_path: Path,
    ass_subtitle_path: Path,
    out_path: Path,
    target_width: int = 2520,
    target_height: int = 1080,    # 21:9
) -> Path:
    """Burn ASS subtitles + crop/pad to 21:9 + H.264 high-quality export."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    vf = (
        f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase,"
        f"crop={target_width}:{target_height},"
        f"ass={shlex.quote(str(ass_subtitle_path))}"
    )
    cmd = (
        f"{settings.ffmpeg_bin} -y -i {shlex.quote(str(video_path))} "
        f"-vf \"{vf}\" "
        f"-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p "
        f"-c:a aac -b:a 192k -movflags +faststart "
        f"{shlex.quote(str(out_path))}"
    )
    await _run(cmd)
    return out_path


async def probe_duration(path: Path) -> float:
    cmd = (
        f"{settings.ffprobe_bin} -v error -show_entries format=duration "
        f"-of default=noprint_wrappers=1:nokey=1 {shlex.quote(str(path))}"
    )
    proc = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    out, _ = await proc.communicate()
    return float(out.decode().strip() or 0)
