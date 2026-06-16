"""Lightweight detector that maps a free-text topic to a NIM model bucket."""

from __future__ import annotations

import re

try:  # langdetect raises at import on some platforms without seed data.
    from langdetect import DetectorFactory, detect
    DetectorFactory.seed = 0
except Exception:  # pragma: no cover - graceful fallback
    detect = None  # type: ignore


_DEVANAGARI = re.compile(r"[\u0900-\u097F]")
_ARABIC = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")


def detect_language(text: str) -> str:
    """Return one of: 'en', 'hi', 'ur', 'roman'.

    Roman = romanised Hindi/Urdu (latin alphabet but non-English markers).
    """
    if _DEVANAGARI.search(text):
        return "hi"
    if _ARABIC.search(text):
        return "ur"

    if detect is not None:
        try:
            iso = detect(text)
            if iso == "hi":
                return "hi"
            if iso == "ur":
                return "ur"
            if iso in {"en"}:
                return "en"
        except Exception:
            pass

    lowered = text.lower()
    roman_markers = (
        " hai ", " hain ", " kya ", " nahi ", " kar ", " mein ",
        " aap ", " tum ", " bhai ", " yaar ",
    )
    if any(marker in f" {lowered} " for marker in roman_markers):
        return "roman"

    return "en"
