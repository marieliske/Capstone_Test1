"""Data models for the simple todo project."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any


class Priority(str, Enum):
    """Priority levels for a todo item.

    Values:
        LOW: Lowest urgency.
        MEDIUM: Default urgency.
        HIGH: High urgency.
    """

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(slots=True)
class Todo:
    """Represents a single todo item.

    Attributes:
        id: Unique identifier for the todo item.
        title: User-facing text for the task.
        completed: Completion state flag.
        priority: Priority level.
        created_at: ISO timestamp when created.
        updated_at: ISO timestamp when last modified.
        due_date: Optional due date string in YYYY-MM-DD format.
    """

    id: str
    title: str
    completed: bool
    priority: Priority
    created_at: str
    updated_at: str
    due_date: str | None = None
    source: str = "manual"

    @classmethod
    def create(
        cls,
        todo_id: str,
        title: str,
        priority: Priority,
        due_date: str | None = None,
        source: str = "manual",
    ) -> "Todo":
        """Create a new todo object with current timestamps.

        Args:
            todo_id: Pre-generated unique ID.
            title: Normalized todo title.
            priority: Priority enum value.
            due_date: Optional due date.

        Returns:
            A new `Todo` instance with `completed=False`.
        """

        now = datetime.utcnow().isoformat(timespec="seconds")
        return cls(
            id=todo_id,
            title=title,
            completed=False,
            priority=priority,
            created_at=now,
            updated_at=now,
            due_date=due_date,
            source=source,
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert the todo to a JSON-serializable dictionary.

        Returns:
            Dictionary representation suitable for JSON encoding.
        """

        return {
            "id": self.id,
            "title": self.title,
            "completed": self.completed,
            "priority": self.priority.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "due_date": self.due_date,
            "source": self.source,
        }

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "Todo":
        """Build a todo instance from a dictionary payload.

        Args:
            payload: Dictionary loaded from JSON.

        Returns:
            Parsed `Todo` instance.
        """

        return cls(
            id=str(payload["id"]),
            title=str(payload["title"]),
            completed=bool(payload["completed"]),
            priority=Priority(str(payload["priority"])),
            created_at=str(payload["created_at"]),
            updated_at=str(payload["updated_at"]),
            due_date=str(payload["due_date"]) if payload.get("due_date") else None,
            source=str(payload.get("source", "manual")),
        )
