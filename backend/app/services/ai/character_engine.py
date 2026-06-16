"""Character cinematics orchestrator.

Pipeline for a scene that features a real historical character:

  portrait + audio --> LivePortrait (lip-sync) --> DeepVideo-V1 (neural render)

For non-character scenes with static imagery we fall back to Wan2.1 to add motion.
"""

from __future__ import annotations

from app.core.logging import logger
from app.models.video import Scene
from app.services import storage
from app.services.ai import deepvideo, liveportrait, wan21


async def synthesize_scene_clip(scene: Scene, *, audio_path: str) -> dict | None:
    """Produce the primary animated clip for a scene.

    Returns the clip asset dict, or ``None`` if no static source was available
    (in which case the assembly engine uses the scraped stock footage directly).
    """
    static = _first_static_image(scene)

    if scene.is_historical_character and static:
        return await _character_pipeline(scene, image=static, audio_path=audio_path)

    if static:
        try:
            return await wan21.animate_image(static["local_path"])
        except Exception as exc:  # pragma: no cover - degrade gracefully
            logger.warning("Wan2.1 animation failed for scene {}: {}", scene.scene_number, exc)
            return None

    return None


async def _character_pipeline(scene: Scene, *, image: dict, audio_path: str) -> dict:
    logger.info("Character cinematics for '{}' (scene {})", scene.character_name, scene.scene_number)
    lip = await liveportrait.animate_portrait(
        image_path=image["local_path"], audio_path=audio_path
    )
    enhanced = await deepvideo.enhance_clip(
        video_path=lip["local_path"],
        character_name=scene.character_name,
        reference_image_path=image["local_path"],
    )
    return enhanced


def _first_static_image(scene: Scene) -> dict | None:
    for asset in scene.media_assets:
        if asset.get("type") == "image" and asset.get("local_path"):
            return asset
    return None
