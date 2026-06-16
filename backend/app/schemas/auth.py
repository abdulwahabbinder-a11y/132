from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class CurrentUser(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
