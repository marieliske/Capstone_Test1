"""Validation and normalization helpers for todo inputs."""

from __future__ import annotations

from datetime import date
from uuid import uuid4


def create_todo_id() -> str:
    """Generate a unique todo identifier.

    Returns:
        UUID4 string.
    """

    return str(uuid4())


def generate_todo_id() -> str:
    """Backward-compatible alias for create_todo_id."""

    return create_todo_id()


def sanitize_title(text: str, *, max_length: int = 80) -> str:
    """Trim and validate a todo title.

    Rules:
        - Title must not be empty after trimming.
        - Max length is configurable and defaults to 80 characters.

    Args:
        text: Raw title input.
        max_length: Maximum title length.

    Returns:
        Cleaned title.

    Raises:
        ValueError: If title is empty or too long.
    """

    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Title cannot be empty.")
    if max_length <= 0:
        raise ValueError("max_length must be greater than 0.")
    if len(cleaned) > max_length:
        raise ValueError(f"Title cannot exceed {max_length} characters.")
    return cleaned


def normalize_title(title: str) -> str:
    """Backward-compatible alias for sanitize_title."""

    return sanitize_title(title)


def parse_due_date(due_date: str | date | None) -> str | None:
    """Validate optional due date string.

    Args:
        due_date: Optional date value as YYYY-MM-DD string or `date`.

    Returns:
        The same date string if valid, otherwise `None` when input is `None` or empty.

    Raises:
        ValueError: If provided date is not valid ISO date format.
    """

    if due_date is None or due_date == "":
        return None
    if isinstance(due_date, date):
        return due_date.isoformat()
    try:
        date.fromisoformat(due_date)
    except ValueError as exc:
        raise ValueError("Due date must be in YYYY-MM-DD format.") from exc
    return due_date


def validate_due_date(due_date: str | None) -> str | None:
    """Backward-compatible alias for parse_due_date."""

    return parse_due_date(due_date)
