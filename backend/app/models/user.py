"""``users`` table representation.

Mirrors the public ``users`` table created in
``supabase/migrations/0001_init.sql``. Supabase Auth owns ``auth.users``; this
public profile row is keyed by the same UUID.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    id: str = Field(..., description="UUID matching auth.users.id")
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
