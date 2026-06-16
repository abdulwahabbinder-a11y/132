"""Unit test for ElevenLabs char->word timestamp collapsing."""

from __future__ import annotations

from app.services.audio.elevenlabs import _chars_to_words


def test_chars_to_words_basic():
    alignment = {
        "characters": list("Hi there"),
        "character_start_times_seconds": [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
        "character_end_times_seconds": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    }
    words = _chars_to_words(alignment)
    assert [w["word"] for w in words] == ["Hi", "there"]
    assert words[0]["start"] == 0.0
    assert words[1]["end"] == 0.8


def test_chars_to_words_empty():
    assert _chars_to_words({}) == []
