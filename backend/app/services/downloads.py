from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from starlette.responses import Response

from app.services.object_storage import presigned_download_url


def resolve_local_video(path_str: str | None) -> Path | None:
    if not path_str:
        return None
    if path_str.startswith("http://") or path_str.startswith("https://"):
        return None
    if path_str.startswith("s3://"):
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


def serve_video_output(path_str: str | None, filename: str = "video.mp4") -> Response:
    """Serve local file or redirect to S3 presigned URL."""
    if not path_str:
        raise HTTPException(status_code=404, detail="Video file not available yet")

    if path_str.startswith("http://") or path_str.startswith("https://"):
        return RedirectResponse(url=path_str, status_code=302)

    if path_str.startswith("s3://"):
        url = presigned_download_url(path_str)
        if not url:
            raise HTTPException(status_code=404, detail="Video file not available yet")
        return RedirectResponse(url=url, status_code=302)

    path = resolve_local_video(path_str)
    if not path:
        raise HTTPException(status_code=404, detail="Video file not available yet")
    return stream_video_file(path, filename)
