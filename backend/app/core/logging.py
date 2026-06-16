"""Loguru-based structured logging configuration."""

from __future__ import annotations

import logging
import sys

from loguru import logger

from app.config import settings


class _InterceptHandler(logging.Handler):
    """Route stdlib logging (uvicorn, celery) through loguru."""

    def emit(self, record: logging.LogRecord) -> None:  # pragma: no cover - glue
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def configure_logging() -> None:
    """Configure loguru as the single logging sink."""
    logger.remove()
    logger.add(
        sys.stdout,
        level="DEBUG" if settings.environment == "development" else "INFO",
        backtrace=settings.environment == "development",
        diagnose=settings.environment == "development",
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
        ),
    )

    logging.basicConfig(handlers=[_InterceptHandler()], level=0, force=True)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "celery"):
        logging.getLogger(name).handlers = [_InterceptHandler()]


__all__ = ["configure_logging", "logger"]
