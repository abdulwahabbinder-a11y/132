"""Wraps Supabase Storage uploads for final artefacts."""

from __future__ import annotations

import uuid
from pathlib import Path

from app.core.config import settings
from app.core.logging import logger
from app.core.supabase_client import get_supabase_service


def upload_final_video(*, job_id: uuid.UUID, local_path: Path) -> str:
    client = get_supabase_service()
    object_key = f"{job_id}/{local_path.name}"

    with local_path.open("rb") as fh:
        client.storage.from_(settings.supabase_storage_bucket).upload(
            path=object_key,
            file=fh.read(),
            file_options={"content-type": "video/mp4", "upsert": "true"},
        )

    public_url = client.storage.from_(
        settings.supabase_storage_bucket
    ).get_public_url(object_key)
    logger.info("Uploaded {} → {}", local_path, public_url)
    return public_url
