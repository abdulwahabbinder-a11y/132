"""Video credit constants and helpers."""

from app.config import get_settings


def credits_per_video() -> int:
    return get_settings().credits_per_video


def can_render_video(credits_left: int) -> bool:
    return credits_left >= credits_per_video()


def deduct_credits(credits_left: int) -> int:
    cost = credits_per_video()
    if credits_left < cost:
        raise ValueError(f"Insufficient credits: need {cost}, have {credits_left}")
    return credits_left - cost


def videos_remaining(credits_left: int) -> int:
    return credits_left // credits_per_video()
