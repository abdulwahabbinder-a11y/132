"""Per-scene multi-source media fetcher.

Decides, for each scene, which sources to hit based on the scene flags:

* ``is_abstract_scene == True``  -> Flux AI art (NVIDIA NIM)
* ``is_abstract_scene == False`` -> archival photos (Wikimedia + Internet Archive)
* always -> stock B-roll (Pexels + Pixabay) keyed on ``visual_keywords``

Returns a manifest dict suitable for storage on the job and consumption by the
Remotion assembly engine.
"""

from __future__ import annotations

import asyncio
from typing import Any, Dict, List

from app.core.logging import get_logger
from app.schemas.story import Scene, StoryScript
from app.services.media.flux import generate_abstract_image
from app.services.scraper import (
    internet_archive,
    pexels,
    pixabay,
    wikimedia,
)
from app.utils.files import download_to, public_url

log = get_logger(__name__)


async def _fetch_archival(job_id: str, scene: Scene) -> List[Dict[str, Any]]:
    query = " ".join(scene.visual_keywords[:3]) or (scene.character_name or "")
    commons, ia = await asyncio.gather(
        wikimedia.search_images(query, limit=3),
        internet_archive.search_media(query, limit=2, mediatype="image"),
        return_exceptions=True,
    )
    hits = [h for h in _flatten(commons, ia)]
    assets: List[Dict[str, Any]] = []
    for hit in hits[:4]:
        local = await download_to(job_id, hit["url"], ".jpg")
        if local:
            assets.append({**hit, "local_path": str(local), "public_url": public_url(local)})
    return assets


async def _fetch_broll(job_id: str, scene: Scene) -> List[Dict[str, Any]]:
    query = " ".join(scene.visual_keywords[:3]) or "cinematic b-roll"
    pex, pix = await asyncio.gather(
        pexels.search_videos(query, limit=2),
        pixabay.search_videos(query, limit=2),
        return_exceptions=True,
    )
    hits = [h for h in _flatten(pex, pix)]
    assets: List[Dict[str, Any]] = []
    for hit in hits[:3]:
        local = await download_to(job_id, hit["url"], ".mp4")
        if local:
            assets.append({**hit, "local_path": str(local), "public_url": public_url(local)})
    return assets


async def fetch_scene_assets(job_id: str, scene: Scene) -> Dict[str, Any]:
    manifest: Dict[str, Any] = {
        "scene_number": scene.scene_number,
        "archival": [],
        "broll": [],
        "ai_art": None,
    }

    if scene.is_abstract_scene:
        image_path = await generate_abstract_image(
            job_id, scene.scene_number, scene.narration_text, scene.visual_keywords
        )
        manifest["ai_art"] = {
            "local_path": str(image_path),
            "public_url": public_url(image_path),
            "provider": "flux-1-dev",
        }
    else:
        manifest["archival"] = await _fetch_archival(job_id, scene)

    manifest["broll"] = await _fetch_broll(job_id, scene)
    return manifest


async def fetch_all(job_id: str, script: StoryScript) -> List[Dict[str, Any]]:
    """Fetch assets for every scene with bounded concurrency."""
    sem = asyncio.Semaphore(4)

    async def _bounded(scene: Scene) -> Dict[str, Any]:
        async with sem:
            return await fetch_scene_assets(job_id, scene)

    results = await asyncio.gather(*[_bounded(s) for s in script.scenes])
    return list(results)


def _flatten(*groups) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for g in groups:
        if isinstance(g, Exception) or g is None:
            continue
        out.extend(g)
    return out
