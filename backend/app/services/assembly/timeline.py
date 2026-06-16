"""Build the Remotion timeline props from script + assets + narration.

The output is a single JSON-serialisable dict matching the props contract that
the Remotion ``DocumentaryVideo`` composition expects (see remotion/src).
"""

from __future__ import annotations

from typing import Any, Dict, List

from app.schemas.story import StoryScript

FPS = 24
ASPECT = {"width": 2560, "height": 1097}  # 21:9


def _pick_primary_visual(scene_assets: Dict[str, Any], animation: Dict[str, Any] | None) -> Dict[str, Any]:
    """Decide what fills the frame for a scene, in priority order."""
    if animation and animation.get("type") == "video" and animation.get("video_path"):
        return {"kind": "video", "src": animation["video_path"]}
    if animation and animation.get("type") == "ken_burns" and animation.get("image_path"):
        return {"kind": "ken_burns", "src": animation["image_path"]}
    if scene_assets.get("ai_art"):
        return {"kind": "ken_burns", "src": scene_assets["ai_art"]["local_path"]}
    if scene_assets.get("broll"):
        return {"kind": "video", "src": scene_assets["broll"][0]["local_path"]}
    if scene_assets.get("archival"):
        return {"kind": "ken_burns", "src": scene_assets["archival"][0]["local_path"]}
    return {"kind": "solid", "src": None}


def build_timeline(
    script: StoryScript,
    assets_by_scene: List[Dict[str, Any]],
    narration_by_scene: Dict[int, Dict[str, Any]],
    animations_by_scene: Dict[int, Dict[str, Any]],
    map_sequence: Dict[str, Any],
) -> Dict[str, Any]:
    assets_lookup = {a["scene_number"]: a for a in assets_by_scene}

    scenes_props: List[Dict[str, Any]] = []
    cursor = 0.0
    for scene in script.scenes:
        narration = narration_by_scene.get(scene.scene_number, {})
        duration = float(narration.get("duration") or 4.0)
        scene_assets = assets_lookup.get(scene.scene_number, {})
        animation = animations_by_scene.get(scene.scene_number)

        scenes_props.append(
            {
                "scene_number": scene.scene_number,
                "start": round(cursor, 3),
                "duration": round(duration, 3),
                "narration_text": scene.narration_text,
                "is_abstract_scene": scene.is_abstract_scene,
                "is_historical_character": scene.is_historical_character,
                "character_name": scene.character_name,
                "location_coordinates": (
                    scene.location_coordinates.model_dump()
                    if scene.location_coordinates
                    else None
                ),
                "primary_visual": _pick_primary_visual(scene_assets, animation),
                "audio_src": narration.get("audio_path"),
                "captions": narration.get("words", []),
                # Motion.dev (Framer Motion) transition config consumed in Remotion.
                "motion": {
                    "enter": {"type": "spring", "stiffness": 120, "damping": 18},
                    "transition_sfx": "whoosh" if scene.scene_number % 2 else "deep_boom",
                },
            }
        )
        cursor += duration

    total_seconds = max(cursor, 1.0)
    return {
        "fps": FPS,
        "width": ASPECT["width"],
        "height": ASPECT["height"],
        "durationInFrames": int(round(total_seconds * FPS)),
        "topic": script.topic,
        "language": script.language.value,
        "scenes": scenes_props,
        "map_sequence": map_sequence,
    }
