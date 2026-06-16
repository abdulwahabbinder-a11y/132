"""Initial schema: users, subscriptions, video_projects, video_scenes

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("is_verified", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_type", sa.String(50), nullable=False, server_default="free"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("stripe_price_id", sa.String(255), nullable=True),
        sa.Column("video_credits_left", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("billing_cycle_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_stripe_customer_id", "subscriptions", ["stripe_customer_id"])

    op.create_table(
        "video_projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("style", sa.String(100), nullable=False, server_default="documentary"),
        sa.Column("aspect_ratio", sa.String(10), nullable=False, server_default="21:9"),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("script_json", sa.JSON(), nullable=True),
        sa.Column("audio_url", sa.String(1024), nullable=True),
        sa.Column("word_timestamps", sa.JSON(), nullable=True),
        sa.Column("output_video_url", sa.String(1024), nullable=True),
        sa.Column("thumbnail_url", sa.String(1024), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column("total_scenes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_video_projects_user_id", "video_projects", ["user_id"])

    op.create_table(
        "video_scenes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_id", UUID(as_uuid=True), sa.ForeignKey("video_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scene_number", sa.Integer(), nullable=False),
        sa.Column("narration_text", sa.Text(), nullable=False),
        sa.Column("visual_keywords", sa.JSON(), nullable=True),
        sa.Column("is_abstract_scene", sa.Boolean(), server_default="false"),
        sa.Column("is_historical_character", sa.Boolean(), server_default="false"),
        sa.Column("character_name", sa.String(255), nullable=True),
        sa.Column("location_coordinates", sa.JSON(), nullable=True),
        sa.Column("image_url", sa.String(1024), nullable=True),
        sa.Column("video_clip_url", sa.String(1024), nullable=True),
        sa.Column("stock_footage_url", sa.String(1024), nullable=True),
        sa.Column("audio_slice_url", sa.String(1024), nullable=True),
        sa.Column("lipsync_video_url", sa.String(1024), nullable=True),
        sa.Column("final_clip_url", sa.String(1024), nullable=True),
        sa.Column("start_time_ms", sa.Integer(), nullable=True),
        sa.Column("end_time_ms", sa.Integer(), nullable=True),
        sa.Column("media_fetched", sa.Boolean(), server_default="false"),
        sa.Column("animated", sa.Boolean(), server_default="false"),
        sa.Column("lipsync_done", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_video_scenes_project_id", "video_scenes", ["project_id"])


def downgrade() -> None:
    op.drop_table("video_scenes")
    op.drop_table("video_projects")
    op.drop_table("subscriptions")
    op.drop_table("users")
