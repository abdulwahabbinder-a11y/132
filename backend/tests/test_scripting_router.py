"""Unit tests for the scripting router (model selection + JSON parsing)."""

from __future__ import annotations

from app.schemas.story import ScriptLanguage
from app.services.scripting.router import _extract_json, select_model
from app.config import settings


def test_english_routes_to_llama():
    assert select_model(ScriptLanguage.ENGLISH) == settings.nim_model_llama


def test_hindi_urdu_roman_route_to_qwen():
    for lang in (ScriptLanguage.HINDI, ScriptLanguage.URDU, ScriptLanguage.ROMAN):
        assert select_model(lang) == settings.nim_model_qwen


def test_extract_json_handles_fenced_output():
    raw = 'Here is your script:\n```json\n{"title": "X", "scenes": []}\n```'
    data = _extract_json(raw)
    assert data["title"] == "X"
    assert data["scenes"] == []


def test_extract_json_plain():
    data = _extract_json('{"title": "Y", "scenes": [{"scene_number": 1}]}')
    assert data["title"] == "Y"
