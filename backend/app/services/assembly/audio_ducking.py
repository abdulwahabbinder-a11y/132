"""FFmpeg sidechain audio-ducking helper (-85% during voice-over)."""

from __future__ import annotations

from pathlib import Path

import ffmpeg

from app.core.logging import logger


def apply_audio_ducking(
    *,
    voice_track: Path,
    music_track: Path,
    output_path: Path,
    duck_db: float = -16.5,
    threshold: float = 0.05,
    ratio: float = 8.0,
    attack_ms: int = 5,
    release_ms: int = 200,
) -> Path:
    """Drop background music by ~85% (≈ -16.5 dB) whenever the voice is active.

    Uses FFmpeg's sidechaincompress filter where the voice track is the
    sidechain trigger.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    voice = ffmpeg.input(str(voice_track))
    music = ffmpeg.input(str(music_track))

    ducked_music = ffmpeg.filter(
        [music.audio, voice.audio],
        "sidechaincompress",
        threshold=threshold,
        ratio=ratio,
        attack=attack_ms,
        release=release_ms,
        makeup=1,
        level_sc=1.0,
    )
    ducked_music = ducked_music.filter("volume", volume=f"{duck_db}dB")
    mixed = ffmpeg.filter(
        [voice.audio, ducked_music],
        "amix",
        inputs=2,
        duration="longest",
        dropout_transition=0,
        normalize=0,
    )

    (
        ffmpeg.output(mixed, str(output_path), acodec="aac", audio_bitrate="192k")
        .overwrite_output()
        .run(quiet=True)
    )

    logger.info("Audio ducked mix written: {}", output_path)
    return output_path
