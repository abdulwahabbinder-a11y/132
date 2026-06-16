"""Convert ElevenLabs word-level timestamps into ASS subtitles for burn-in."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, List


ASS_HEADER = """[Script Info]
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 2520
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,52,&H00FFFFFF,&H000000FF,&H88000000,&H88000000,1,0,0,0,100,100,0,0,1,3,2,2,80,80,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def _ass_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    return f"{h:d}:{m:02d}:{s:02d}.{cs:02d}"


def _chunk_words(words: List[dict], *, max_chars: int = 42) -> Iterable[List[dict]]:
    chunk: list[dict] = []
    char_count = 0
    for w in words:
        wlen = len(w["word"]) + 1
        if char_count + wlen > max_chars and chunk:
            yield chunk
            chunk, char_count = [], 0
        chunk.append(w)
        char_count += wlen
    if chunk:
        yield chunk


def write_ass(
    *,
    word_timestamps: List[dict],
    out_path: Path,
    offset_s: float = 0.0,
) -> Path:
    """Write an ASS subtitle file with 1-line, center-bottom aligned captions."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        f.write(ASS_HEADER)
        for chunk in _chunk_words(word_timestamps):
            start = _ass_time(chunk[0]["start_s"] + offset_s)
            end = _ass_time(chunk[-1]["end_s"] + offset_s)
            text = " ".join(w["word"] for w in chunk).replace("\n", " ")
            f.write(
                f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n"
            )
    return out_path
