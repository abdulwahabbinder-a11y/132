from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class VideoJobOut(BaseModel):
    id: str
    topic: str
    language: str
    status: str
    progress: int
    output_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None


class VideoJobDetail(VideoJobOut):
    script: Optional[Any] = None
    assets: Optional[Any] = None
