"""Mapbox Static Images + animated map sequence helpers.

Per scene, we hand the Remotion `MapScene` component a sequence of viewports
(camera fly path between scenes' `location_coordinates`). Remotion + Motion.dev
interpolates camera bearings/zooms on the client side and we either:
    a) Use Mapbox GL JS inside Remotion (preferred — vector, dynamic), or
    b) Pre-fetch Static API tiles and Ken-Burns-pan them.
"""

from __future__ import annotations

from typing import List, Tuple

from app.config import settings

LngLat = Tuple[float, float]


def static_tile_url(
    *,
    lng: float,
    lat: float,
    zoom: float = 5.5,
    width: int = 1280,
    height: int = 720,
    style: str = "mapbox/dark-v11",
) -> str:
    """Mapbox Static Images URL (returned as-is to the Remotion component)."""
    return (
        f"https://api.mapbox.com/styles/v1/{style}/static/"
        f"{lng},{lat},{zoom},0/{width}x{height}@2x"
        f"?access_token={settings.mapbox_access_token}"
    )


def build_camera_path(coords: List[LngLat], *, zoom: float = 4.5) -> List[dict]:
    """Build a list of `{lng, lat, zoom, bearing}` waypoints for the animation."""
    if not coords:
        return []
    return [
        {
            "lng": lng,
            "lat": lat,
            "zoom": zoom,
            "bearing": (i * 12) % 360,
            "pitch": 35,
        }
        for i, (lng, lat) in enumerate(coords)
    ]
