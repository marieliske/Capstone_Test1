"""Persistence layer for saving and loading todos from a JSON file."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from .models import Todo


class JsonTodoStorage:
    """File-backed JSON storage for todo records.

        The storage format is a top-level JSON object:
        {
            "version": 2,
            "saved_at": "...",
            "todos": [ ... ]
        }
    """

    def __init__(self, file_path: str | Path = "todos.json") -> None:
        """Initialize storage path.

        Args:
            file_path: Target JSON file path.
        """

        self.file_path = Path(file_path)

    def read_todos(self) -> list[Todo]:
        """Load todos from disk.

        Returns:
            List of todo objects. Returns empty list if file does not exist.

        Raises:
            ValueError: If JSON is malformed or schema is unsupported.
        """

        if not self.file_path.exists():
            return []

        try:
            payload = json.loads(self.file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError("Storage file is not valid JSON.") from exc

        if not isinstance(payload, dict):
            raise ValueError("Unsupported storage schema.")

        version = payload.get("version")
        if version not in (1, 2):
            raise ValueError("Unsupported storage schema.")

        raw_todos = payload.get("todos", [])
        if not isinstance(raw_todos, list):
            raise ValueError("Storage payload has invalid todos list.")

        return [Todo.from_mapping(item) for item in raw_todos]

    def load(self) -> list[Todo]:
        """Backward-compatible alias for read_todos."""

        return self.read_todos()

    def write_todos(self, todos: list[Todo], *, pretty: bool = True) -> None:
        """Persist todos to disk.

        Args:
            todos: Current todo collection.
            pretty: If `True`, use indented JSON output.
        """

        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": 2,
            "saved_at": datetime.utcnow().isoformat(timespec="seconds"),
            "todos": [todo.as_dict() for todo in todos],
        }
        indent = 2 if pretty else None
        self.file_path.write_text(json.dumps(payload, indent=indent), encoding="utf-8")

    def save(self, todos: list[Todo]) -> None:
        """Backward-compatible alias for write_todos."""

        self.write_todos(todos)
