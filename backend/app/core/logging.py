"""Loguru-based application logging setup."""

import sys

from loguru import logger

from app.config import settings


def configure_logging() -> None:
    logger.remove()
    logger.add(
        sys.stdout,
        level="DEBUG" if settings.app_env == "development" else "INFO",
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> "
            "| <level>{level: <8}</level> "
            "| <cyan>{name}:{function}:{line}</cyan> "
            "- <level>{message}</level>"
        ),
        backtrace=settings.app_env != "production",
        diagnose=settings.app_env != "production",
    )
