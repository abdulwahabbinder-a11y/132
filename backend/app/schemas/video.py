"""Video project schemas (asset bundle, status reporting)."""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel

VideoStatus = Literal[
    "queued", "scripting", "scraping", "rendering", "composing", "completed", "failed"
]


class SceneAssets(BaseModel):
    scene_number: int
    narration_audio_url: Optional[str] = None
    word_timestamps: List[Dict[str, Any]] = []
    background_video_urls: List[str] = []
    image_urls: List[str] = []
    animated_clip_url: Optional[str] = None
    character_clip_url: Optional[str] = None
    map_clip_url: Optional[str] = None
    wiki_facts: List[str] = []


class VideoOut(BaseModel):
    id: str
    topic: str
    language: str
    status: VideoStatus
    progress_pct: int
    output_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
