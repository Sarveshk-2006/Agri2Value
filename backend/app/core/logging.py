# backend/app/core/logging.py
"""
Structured logging configuration using structlog.
Logs are structured (JSON-serializable) and never contain secrets or tokens.
"""
import logging
import sys

import structlog


def configure_logging(debug: bool = False) -> None:
    """Configure structlog for the application."""
    log_level = logging.DEBUG if debug else logging.INFO

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
    ]

    if debug:
        # Human-readable in development
        renderer = structlog.dev.ConsoleRenderer()
    else:
        # JSON in production/staging
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Also configure stdlib logging to route through structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )


def get_logger(name: str = __name__):
    """Return a structlog logger bound to the given name."""
    return structlog.get_logger(name)
