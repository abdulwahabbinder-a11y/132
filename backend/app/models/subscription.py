import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PlanType(str, PyEnum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, PyEnum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    plan_type: Mapped[PlanType] = mapped_column(
        Enum(PlanType), default=PlanType.FREE, nullable=False
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False
    )

    stripe_customer_id: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    stripe_subscription_id: Mapped[str] = mapped_column(String(255), nullable=True)
    stripe_price_id: Mapped[str] = mapped_column(String(255), nullable=True)

    video_credits_left: Mapped[int] = mapped_column(Integer, default=3)  # 3 free credits
    billing_cycle_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="subscription")

    @property
    def has_credits(self) -> bool:
        return self.video_credits_left > 0

    @property
    def is_pro(self) -> bool:
        return self.plan_type == PlanType.PRO and self.status == SubscriptionStatus.ACTIVE

    def __repr__(self) -> str:
        return f"<Subscription user={self.user_id} plan={self.plan_type} credits={self.video_credits_left}>"
