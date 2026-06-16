"""Convert ElevenLabs character timestamps into burn-in SRT subtitles."""

from __future__ import annotations

from pathlib import Path
from typing import Any


def _fmt(t: float) -> str:
    hours = int(t // 3600)
    minutes = int((t % 3600) // 60)
    seconds = int(t % 60)
    ms = int((t - int(t)) * 1000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{ms:03}"


def build_srt_from_elevenlabs(
    *,
    alignment: dict[str, Any],
    output_path: Path,
    max_chars_per_cue: int = 42,
    max_seconds_per_cue: float = 3.5,
) -> Path:
    """Group ElevenLabs per-character timings into short, readable cues."""
    chars: list[str] = alignment.get("characters", [])
    starts: list[float] = alignment.get("character_start_times_seconds", [])
    ends: list[float] = alignment.get("character_end_times_seconds", [])

    if not chars or len(chars) != len(starts) or len(chars) != len(ends):
        raise ValueError("Malformed ElevenLabs alignment payload.")

    cues: list[tuple[float, float, str]] = []
    buf: list[str] = []
    cue_start: float | None = None
    cue_last_end: float = 0.0

    def flush() -> None:
        nonlocal buf, cue_start, cue_last_end
        if buf and cue_start is not None:
            text = "".join(buf).strip()
            if text:
                cues.append((cue_start, cue_last_end, text))
        buf, cue_start = [], None

    for ch, start, end in zip(chars, starts, ends, strict=False):
        if cue_start is None:
            cue_start = start
        buf.append(ch)
        cue_last_end = end

        too_long = sum(len(x) for x in buf) >= max_chars_per_cue
        too_slow = end - cue_start >= max_seconds_per_cue
        ends_sentence = ch in ".?!" and len("".join(buf).strip()) > 8
        if too_long or too_slow or ends_sentence:
            flush()
    flush()

    lines: list[str] = []
    for idx, (start, end, text) in enumerate(cues, start=1):
        lines.append(str(idx))
        lines.append(f"{_fmt(start)} --> {_fmt(end)}")
        lines.append(text)
        lines.append("")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path
