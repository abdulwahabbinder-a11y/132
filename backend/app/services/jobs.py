"""Video job persistence helpers (Supabase service role + in-memory fallback)."""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger
from app.db.supabase_client import get_service_supabase

log = get_logger(__name__)

_MEMORY_JOBS: Dict[str, Dict[str, Any]] = {}


def create_job(user_id: str, topic: str, language: str, script: Dict[str, Any]) -> str:
    job_id = str(uuid.uuid4())
    record = {
        "id": job_id,
        "user_id": user_id,
        "topic": topic,
        "language": language,
        "status": "pending",
        "progress": 0,
        "script": script,
        "assets": None,
        "output_url": None,
        "error_message": None,
    }
    sb = get_service_supabase()
    if sb is None:
        _MEMORY_JOBS[job_id] = record
        return job_id
    sb.table("video_jobs").insert(record).execute()
    return job_id


def update_job(job_id: str, **fields: Any) -> None:
    sb = get_service_supabase()
    if sb is None:
        if job_id in _MEMORY_JOBS:
            _MEMORY_JOBS[job_id].update(fields)
        return
    sb.table("video_jobs").update(fields).eq("id", job_id).execute()


def set_status(job_id: str, status: str, progress: int | None = None) -> None:
    fields: Dict[str, Any] = {"status": status}
    if progress is not None:
        fields["progress"] = progress
    update_job(job_id, **fields)
    log.info("job.status", job=job_id, status=status, progress=progress)


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    sb = get_service_supabase()
    if sb is None:
        return _MEMORY_JOBS.get(job_id)
    res = sb.table("video_jobs").select("*").eq("id", job_id).limit(1).execute()
    return res.data[0] if res.data else None


def list_jobs(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    sb = get_service_supabase()
    if sb is None:
        return [j for j in _MEMORY_JOBS.values() if j["user_id"] == user_id]
    res = (
        sb.table("video_jobs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []
