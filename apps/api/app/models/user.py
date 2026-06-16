import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    preferred_language: Mapped[str] = mapped_column(String(32), nullable=False, default="english")

    subscription = relationship("Subscription", back_populates="user", uselist=False)
    generation_jobs = relationship("GenerationJob", back_populates="user")
