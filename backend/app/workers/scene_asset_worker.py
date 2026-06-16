import asyncio
from pathlib import Path
from typing import Any

from app.schemas.story import StoryScene
from app.services.audio_video_pipeline import (
    animate_static_image_to_video,
    generate_voiceover_with_timestamps,
    run_deepvideo_v1_neural_render,
    run_liveportrait_lipsync,
)
from app.services.media_fetcher import download_binary_asset, generate_flux_image, pick_best_stock_video
from app.services.scrapers import (
    fetch_internet_archive_assets,
    fetch_pexels_stock_video,
    fetch_pixabay_stock_video,
    fetch_wikidata_entities,
    fetch_wikimedia_commons_media,
    fetch_wikipedia_summary,
)


async def process_scene_assets(project_id: str, scene: StoryScene) -> dict[str, Any]:
    scene_dir = Path("generated") / project_id / f"scene-{scene.scene_number:02d}"
    facts_task = fetch_wikipedia_summary(scene.narration_text[:140])
    entities_task = fetch_wikidata_entities(scene.narration_text[:140])

    commons_task = None
    archive_task = None
    flux_output = None
    if scene.is_abstract_scene:
        flux_output = await generate_flux_image(" ".join(scene.visual_keywords), scene_dir, scene.scene_number)
    else:
        commons_task = fetch_wikimedia_commons_media(scene.visual_keywords)
        archive_task = fetch_internet_archive_assets(scene.visual_keywords)

    pexels_task = fetch_pexels_stock_video(scene.visual_keywords)
    pixabay_task = fetch_pixabay_stock_video(scene.visual_keywords)
    voice_audio_path, timestamps_path = await generate_voiceover_with_timestamps(
        scene.narration_text, scene_dir, scene.scene_number
    )

    results = await asyncio.gather(
        facts_task,
        entities_task,
        pexels_task,
        pixabay_task,
        commons_task if commons_task else asyncio.sleep(0, result=[]),
        archive_task if archive_task else asyncio.sleep(0, result=[]),
    )
    facts, entities, pexels_videos, pixabay_videos, commons_assets, archive_assets = results

    stock_url = pick_best_stock_video(pexels_videos) or pick_best_stock_video(pixabay_videos)
    stock_file = None
    if stock_url:
        stock_file = await download_binary_asset(stock_url, scene_dir / "stock-footage.mp4")

    animated_path = None
    if flux_output:
        animated_path = await animate_static_image_to_video(
            str(flux_output),
            f"Cinematic documentary motion about {' '.join(scene.visual_keywords)}",
            scene.scene_number,
            scene_dir,
        )

    character_pipeline_output = None
    if scene.is_historical_character:
        source_image_url = select_character_reference(commons_assets, archive_assets)
        liveportrait_output = await run_liveportrait_lipsync(source_image_url, voice_audio_path, scene_dir)
        character_pipeline_output = await run_deepvideo_v1_neural_render(liveportrait_output, scene_dir)

    return {
        "scene_number": scene.scene_number,
        "facts": facts,
        "entities": entities,
        "commons_assets": commons_assets,
        "archive_assets": archive_assets,
        "stock_file": str(stock_file) if stock_file else None,
        "flux_output": str(flux_output) if flux_output else None,
        "animated_clip": str(animated_path) if animated_path else None,
        "voice_audio": str(voice_audio_path),
        "timestamps": str(timestamps_path),
        "character_clip": str(character_pipeline_output) if character_pipeline_output else None,
    }


def select_character_reference(commons_assets: list[dict[str, Any]], archive_assets: list[dict[str, Any]]) -> str:
    if commons_assets:
        imageinfo = commons_assets[0].get("imageinfo", [])
        if imageinfo:
            return imageinfo[0].get("url", "")
    if archive_assets:
        identifier = archive_assets[0].get("identifier", "")
        return f"https://archive.org/download/{identifier}"
    return ""
