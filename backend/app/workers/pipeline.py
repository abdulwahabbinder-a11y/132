"""End-to-end async generation pipeline.

Orchestrates: scrape -> voice -> animate -> assemble -> render. Progress and
status are persisted to the job record at each stage so the frontend dashboard
can poll live progress.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from app.core.logging import get_logger
from app.schemas.story import Scene, StoryScript
from app.services import jobs as job_service
from app.services.assembly import remotion
from app.services.assembly.maps import build_map_sequence
from app.services.assembly.subtitles import write_srt
from app.services.assembly.timeline import build_timeline
from app.services.media.fetcher import fetch_all
from app.services.tts import elevenlabs
from app.services.video import deepvideo, wan21
from app.utils.files import job_dir, public_url

log = get_logger(__name__)


async def run_pipeline(job_id: str) -> Dict[str, Any]:
    job = job_service.get_job(job_id)
    if not job:
        raise RuntimeError(f"Job {job_id} not found")

    script = StoryScript.model_validate(job["script"])

    # ---- 1. Scrape & fetch media -------------------------------------------
    job_service.set_status(job_id, "scraping", 15)
    assets_by_scene = await fetch_all(job_id, script)
    job_service.update_job(job_id, assets={"scenes": assets_by_scene})

    # ---- 2. Narration (ElevenLabs) -----------------------------------------
    job_service.set_status(job_id, "voicing", 40)
    narration_by_scene: Dict[int, Dict[str, Any]] = {}
    for scene in script.scenes:
        result = await elevenlabs.synthesize(job_id, scene.scene_number, scene.narration_text)
        narration_by_scene[scene.scene_number] = result.to_dict()

    # ---- 3. Animate stills / character cinematics --------------------------
    job_service.set_status(job_id, "animating", 60)
    animations_by_scene = await _animate_scenes(
        job_id, script, assets_by_scene, narration_by_scene
    )

    # ---- 4. Build timeline + subtitles -------------------------------------
    job_service.set_status(job_id, "assembling", 78)
    map_sequence = build_map_sequence(script)
    timeline = build_timeline(
        script, assets_by_scene, narration_by_scene, animations_by_scene, map_sequence
    )

    scene_offsets = [
        {"offset": s["start"], "words": s.get("captions", [])} for s in timeline["scenes"]
    ]
    srt_path = write_srt(job_id, scene_offsets)
    timeline["subtitles_srt"] = str(srt_path)

    # ---- 5. Render with Remotion -------------------------------------------
    job_service.set_status(job_id, "rendering", 90)
    output = remotion.render(job_id, timeline)

    output_url = public_url(Path(output))
    job_service.update_job(job_id, output_url=output_url)
    job_service.set_status(job_id, "completed", 100)
    log.info("pipeline.completed", job=job_id, output=output_url)
    return {"job_id": job_id, "output_url": output_url}


async def _animate_scenes(
    job_id: str,
    script: StoryScript,
    assets_by_scene: List[Dict[str, Any]],
    narration_by_scene: Dict[int, Dict[str, Any]],
) -> Dict[int, Dict[str, Any]]:
    lookup = {a["scene_number"]: a for a in assets_by_scene}
    animations: Dict[int, Dict[str, Any]] = {}

    for scene in script.scenes:
        scene_assets = lookup.get(scene.scene_number, {})
        narration = narration_by_scene.get(scene.scene_number, {})

        # Historical character -> LivePortrait -> DeepVideo-V1.
        if scene.is_historical_character:
            portrait = _portrait_for(scene, scene_assets)
            audio = narration.get("audio_path")
            if portrait and audio:
                animations[scene.scene_number] = await deepvideo.render_character_scene(
                    job_id, scene.scene_number, Path(portrait), Path(audio)
                )
                continue

        # Static image (Flux / archival) -> Wan2.1 motion clip.
        still = _still_for(scene_assets)
        if still:
            animations[scene.scene_number] = await wan21.animate_still(
                job_id,
                scene.scene_number,
                Path(still),
                scene.narration_text,
                scene.visual_keywords,
            )
    return animations


def _portrait_for(scene: Scene, scene_assets: Dict[str, Any]) -> str | None:
    if scene_assets.get("archival"):
        return scene_assets["archival"][0]["local_path"]
    if scene_assets.get("ai_art"):
        return scene_assets["ai_art"]["local_path"]
    return None


def _still_for(scene_assets: Dict[str, Any]) -> str | None:
    if scene_assets.get("ai_art"):
        return scene_assets["ai_art"]["local_path"]
    if scene_assets.get("archival"):
        return scene_assets["archival"][0]["local_path"]
    return None
