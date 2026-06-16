"""Tests for model routing + strict scene validation (run offline via NIM mock)."""

from __future__ import annotations

import pytest

from app.core.config import settings
from app.schemas.story import GenerateStoryRequest, Language
from app.services.scripting.router import generate_script, select_model


def test_select_model_routes_languages():
    assert select_model(Language.english) == settings.NIM_LLM_MODEL_EN
    assert select_model(Language.hindi) == settings.NIM_LLM_MODEL_INTL
    assert select_model(Language.urdu) == settings.NIM_LLM_MODEL_INTL
    assert select_model(Language.roman) == settings.NIM_LLM_MODEL_INTL


@pytest.mark.asyncio
async def test_generate_script_returns_chronological_scenes():
    req = GenerateStoryRequest(topic="The Silk Road", language=Language.english)
    script = await generate_script(req)
    assert len(script.scenes) >= 1
    numbers = [s.scene_number for s in script.scenes]
    assert numbers == sorted(numbers)
    assert numbers[0] == 1
