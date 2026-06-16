"""Subtitle generation from ElevenLabs word timestamps.

Produces both an SRT file (for FFmpeg burn-in) and a structured caption track
(for Remotion's animated centre-bottom subtitle component).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from app.utils.files import job_dir


def _fmt_ts(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def group_words_into_cues(
    words: List[Dict[str, Any]], max_words: int = 6, max_gap: float = 0.6
) -> List[Dict[str, Any]]:
    cues: List[Dict[str, Any]] = []
    bucket: List[Dict[str, Any]] = []

    def flush() -> None:
        if bucket:
            cues.append(
                {
                    "start": bucket[0]["start"],
                    "end": bucket[-1]["end"],
                    "text": " ".join(w["word"] for w in bucket),
                }
            )

    for w in words:
        if bucket and (
            len(bucket) >= max_words or (w["start"] - bucket[-1]["end"]) > max_gap
        ):
            flush()
            bucket = []
        bucket.append(w)
    flush()
    return cues


def write_srt(job_id: str, scene_offsets: List[Dict[str, Any]]) -> Path:
    """Build a single SRT for the whole video.

    ``scene_offsets`` is a list of {"offset": float, "words": [...]} where offset
    is the scene's start time on the global timeline.
    """
    lines: List[str] = []
    index = 1
    for entry in scene_offsets:
        offset = entry["offset"]
        shifted = [
            {"word": w["word"], "start": w["start"] + offset, "end": w["end"] + offset}
            for w in entry.get("words", [])
        ]
        for cue in group_words_into_cues(shifted):
            lines.append(str(index))
            lines.append(f"{_fmt_ts(cue['start'])} --> {_fmt_ts(cue['end'])}")
            lines.append(cue["text"])
            lines.append("")
            index += 1

    srt_path = job_dir(job_id) / "subtitles.srt"
    srt_path.write_text("\n".join(lines), encoding="utf-8")
    return srt_path
