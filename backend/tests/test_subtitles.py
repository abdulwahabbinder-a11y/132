"""Subtitle cue grouping + SRT timestamp formatting tests."""

from __future__ import annotations

from app.services.assembly.subtitles import _fmt_ts, group_words_into_cues


def test_fmt_ts():
    assert _fmt_ts(0) == "00:00:00,000"
    assert _fmt_ts(3661.5) == "01:01:01,500"


def test_group_words_into_cues_splits_on_count():
    words = [{"word": f"w{i}", "start": i * 0.3, "end": i * 0.3 + 0.25} for i in range(13)]
    cues = group_words_into_cues(words, max_words=6)
    assert len(cues) == 3
    assert cues[0]["text"].split()[0] == "w0"
