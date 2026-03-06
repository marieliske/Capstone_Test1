"""Persistence layer for saving and loading todos from a JSON file."""

from __future__ import annotations

import json
from pathlib import Path

from .models import Todo


class JsonTodoStorage:
    """File-backed JSON storage for todo records.

        The storage format is a top-level JSON object:
        {
            "version": 1,
            "todos": [ ... ]
        }
    """

    def __init__(self, file_path: str | Path = "todos.json") -> None:
        """Initialize storage path.

        Args:
            file_path: Target JSON file path.
        """

        self.file_path = Path(file_path)

    def load(self) -> list[Todo]:
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

        if not isinstance(payload, dict) or payload.get("version") != 1:
            raise ValueError("Unsupported storage schema.")

        raw_todos = payload.get("todos", [])
        if not isinstance(raw_todos, list):
            raise ValueError("Storage payload has invalid todos list.")

        return [Todo.from_dict(item) for item in raw_todos]

    def save(self, todos: list[Todo]) -> None:
        """Persist todos to disk.

        Args:
            todos: Current todo collection.
        """

        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": 1,
            "todos": [todo.to_dict() for todo in todos],
        }
        self.file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
