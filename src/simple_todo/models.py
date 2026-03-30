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
    def build(
        cls,
        todo_id: str,
        text: str,
        *,
        priority: Priority,
        due_date: str | None = None,
        completed: bool = False,
        created_at: str | None = None,
        updated_at: str | None = None,
        source: str = "manual",
    ) -> "Todo":
        """Create a new todo object with current timestamps.

        Args:
            todo_id: Pre-generated unique ID.
            text: Normalized todo title.
            priority: Priority enum value.
            due_date: Optional due date.
            completed: Initial completion state.
            created_at: Optional creation timestamp.
            updated_at: Optional update timestamp.
            source: Origin tag.

        Returns:
            A new `Todo` instance with `completed=False`.
        """

        now = datetime.utcnow().isoformat(timespec="seconds")
        created_value = created_at or now
        updated_value = updated_at or created_value
        return cls(
            id=todo_id,
            title=text,
            completed=completed,
            priority=priority,
            created_at=created_value,
            updated_at=updated_value,
            due_date=due_date,
            source=source,
        )

    @classmethod
    def create(
        cls,
        todo_id: str,
        title: str,
        priority: Priority,
        due_date: str | None = None,
        source: str = "manual",
    ) -> "Todo":
        """Backward-compatible alias for build."""

        return cls.build(
            todo_id,
            title,
            priority=priority,
            due_date=due_date,
            source=source,
        )

    def as_dict(self, *, enum_as_value: bool = True, include_source: bool = True) -> dict[str, Any]:
        """Convert the todo to a JSON-serializable dictionary.

        Returns:
            Dictionary representation suitable for JSON encoding.
        """

        priority_value: str | Priority = self.priority.value if enum_as_value else self.priority
        payload: dict[str, Any] = {
            "id": self.id,
            "title": self.title,
            "completed": self.completed,
            "priority": priority_value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "due_date": self.due_date,
        }
        if include_source:
            payload["source"] = self.source
        return payload

    def to_dict(self) -> dict[str, Any]:
        """Backward-compatible alias for as_dict."""

        return self.as_dict()

    @classmethod
    def from_mapping(cls, payload: dict[str, Any], *, default_source: str = "manual") -> "Todo":
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
            source=str(payload.get("source", default_source)),
        )

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "Todo":
        """Backward-compatible alias for from_mapping."""

        return cls.from_mapping(payload)
