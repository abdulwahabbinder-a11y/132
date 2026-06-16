"""SQLAlchemy declarative base.

These ORM models mirror the Supabase SQL schema in
``supabase/migrations/0001_init.sql``. They are primarily used for typed access
and optional direct-Postgres operations; runtime CRUD generally flows through
the Supabase client (which enforces RLS).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
