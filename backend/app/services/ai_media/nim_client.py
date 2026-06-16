"""Shared NVIDIA NIM HTTP client (auth, retries, async polling)."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


def _auth_headers() -> dict[str, str]:
    if not settings.nvidia_nim_api_key:
        raise RuntimeError("NVIDIA_NIM_API_KEY is not configured.")
    return {
        "Authorization": f"Bearer {settings.nvidia_nim_api_key}",
        "Accept": "application/json",
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=30), reraise=True)
async def invoke(model: str, payload: dict[str, Any]) -> dict[str, Any]:
    """POST a synchronous job and return the JSON response.

    For long-running pipelines NIM returns either the result directly or a
    `status_url` to poll — `invoke_with_polling` handles both transparently.
    """
    url = f"{settings.nvidia_nim_base_url}/{model}/infer"
    async with httpx.AsyncClient(timeout=180) as c:
        r = await c.post(url, headers=_auth_headers(), json=payload)
        r.raise_for_status()
        return r.json()


async def invoke_with_polling(
    model: str,
    payload: dict[str, Any],
    *,
    poll_interval_s: float = 4.0,
    timeout_s: float = 900.0,
) -> dict[str, Any]:
    """Submit a job; if NIM returns a 202 + status URL, poll until completion."""
    url = f"{settings.nvidia_nim_base_url}/{model}/infer"
    async with httpx.AsyncClient(timeout=120) as c:
        submit = await c.post(url, headers=_auth_headers(), json=payload)
        if submit.status_code in (200, 201):
            return submit.json()
        if submit.status_code != 202:
            submit.raise_for_status()

        status_url = submit.headers.get("NVCF-Status-URL") or submit.json().get("status_url")
        if not status_url:
            raise RuntimeError(f"NIM 202 without status URL for model {model}")

        deadline = asyncio.get_event_loop().time() + timeout_s
        while asyncio.get_event_loop().time() < deadline:
            await asyncio.sleep(poll_interval_s)
            p = await c.get(status_url, headers=_auth_headers())
            if p.status_code == 200:
                return p.json()
            if p.status_code != 202:
                p.raise_for_status()
            logger.debug("NIM job pending — model={} status={}", model, p.status_code)

    raise TimeoutError(f"NIM job timed out after {timeout_s}s for model {model}")
