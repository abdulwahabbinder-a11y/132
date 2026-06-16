from datetime import datetime

from pydantic import BaseModel


class VideoJobStatusResponse(BaseModel):
    job_id: str
    status: str
    output_video_url: str | None = None
    error_message: str | None = None
    updated_at: datetime
