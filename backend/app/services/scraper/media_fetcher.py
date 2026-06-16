"""Multi-source media fetcher.

For each scene, decides which sources to query based on the scripting flags and
returns a ranked list of candidate media assets:

* abstract scene            -> Flux text-to-image (NVIDIA NIM)
* concrete/archival scene   -> Wikimedia Commons + Internet Archive
* B-roll for keywords       -> Pexels + Pixabay
* verifiable facts          -> Wikipedia/Wikidata (attached to the scene)
"""

from __future__ import annotations

import asyncio

from app.core.logging import logger
from app.models.video import Scene
from app.services.ai import flux
from app.services.scraper import (
    internet_archive,
    pexels,
    pixabay,
    wikimedia,
    wikipedia,
)


async def fetch_scene_media(scene: Scene, *, topic: str) -> Scene:
    """Populate ``scene.media_assets`` from all relevant sources."""
    query = " ".join(scene.visual_keywords) or topic
    tasks: list[asyncio.Task] = []

    if scene.is_abstract_scene:
        tasks.append(
            asyncio.create_task(
                flux.generate_abstract_image(
                    keywords=scene.visual_keywords, narration=scene.narration_text
                )
            )
        )
    else:
        tasks.append(asyncio.create_task(wikimedia.search_images(query, limit=4)))
        tasks.append(
            asyncio.create_task(
                internet_archive.search_media(query, media_type="image", limit=3)
            )
        )

    # Generic B-roll is always useful as filler / transitions.
    tasks.append(asyncio.create_task(pexels.search_videos(query, limit=2)))
    tasks.append(asyncio.create_task(pixabay.search_videos(query, limit=2)))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    assets: list[dict] = []
    for result in results:
        if isinstance(result, Exception):
            logger.warning("Media source failed: {}", result)
            continue
        if isinstance(result, list):
            assets.extend(result)
        elif isinstance(result, dict):
            assets.append(result)

    scene.media_assets = assets
    logger.info("Scene {} fetched {} assets", scene.scene_number, len(assets))
    return scene


async def fetch_verifiable_facts(topic: str) -> dict:
    """Fetch a grounded summary + timeline facts for the whole documentary."""
    summary = await wikipedia.fetch_summary(topic)
    facts = await wikipedia.fetch_timeline_facts(topic)
    return {"summary": summary, "facts": facts}
