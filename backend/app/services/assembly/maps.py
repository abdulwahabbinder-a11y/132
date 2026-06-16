"""Geopolitical map sequence configuration for Remotion.

We do not render maps server-side; instead we emit a declarative spec that the
Remotion ``MapSequence`` component consumes. It uses the Mapbox Static / GL
token and animates camera fly-to transitions between the scene coordinates.
"""

from __future__ import annotations

from typing import Any, Dict, List

from app.core.config import settings
from app.schemas.story import StoryScript


def build_map_sequence(script: StoryScript) -> Dict[str, Any]:
    waypoints: List[Dict[str, Any]] = []
    for scene in script.scenes:
        if scene.location_coordinates:
            waypoints.append(
                {
                    "scene_number": scene.scene_number,
                    "lat": scene.location_coordinates.lat,
                    "lng": scene.location_coordinates.lng,
                    "label": scene.location_coordinates.label,
                }
            )
    return {
        "mapbox_token": settings.MAPBOX_ACCESS_TOKEN,
        "style": "mapbox://styles/mapbox/dark-v11",
        "fly_to_duration_s": 2.0,
        "zoom": 5,
        "waypoints": waypoints,
    }
