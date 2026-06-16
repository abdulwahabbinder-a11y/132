from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse


def resolve_local_video(path_str: str | None) -> Path | None:
    if not path_str:
        return None
    if path_str.startswith("http://") or path_str.startswith("https://"):
        return None
    path = Path(path_str)
    if not path.is_file():
        return None
    return path


def stream_video_file(path: Path, filename: str = "video.mp4") -> FileResponse:
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(
        path,
        media_type="video/mp4",
        filename=filename,
    )
