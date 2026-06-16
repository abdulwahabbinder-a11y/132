"""Centralised loguru-based logging configuration."""

from __future__ import annotations

import sys

from loguru import logger

from .config import settings


def configure_logging() -> None:
    logger.remove()
    logger.add(
        sys.stdout,
        level=settings.log_level.upper(),
        backtrace=False,
        diagnose=settings.app_env == "development",
        enqueue=True,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        ),
    )


__all__ = ["configure_logging", "logger"]
