"""Business logic for managing todos."""

from __future__ import annotations

from datetime import date, datetime

from .models import Priority, Todo
from .storage import JsonTodoStorage
from .validators import generate_todo_id, normalize_title, validate_due_date


class TodoService:
    """High-level API used by applications and CLI.

    This class loads all todos on initialization and keeps an in-memory list.
    Mutating operations persist changes immediately through the storage backend.
    """

    def __init__(self, storage: JsonTodoStorage | None = None) -> None:
        """Create service instance.

        Args:
            storage: Optional custom storage backend. Defaults to `JsonTodoStorage()`.
        """

        self.storage = storage or JsonTodoStorage()
        self.todos = self.storage.load()

    def add_todo(
        self,
        title: str,
        priority: Priority = Priority.LOW,
        due_date: str | None = None,
        source: str = "manual",
    ) -> Todo:
        """Create and persist a new todo.

        Args:
            title: Human-readable task title.
            priority: Priority enum value.
            due_date: Optional due date in YYYY-MM-DD format.

        Returns:
            The created todo object.
        """

        clean_title = normalize_title(title)
        clean_due_date = validate_due_date(due_date)
        todo = Todo.create(
            generate_todo_id(),
            clean_title,
            priority,
            clean_due_date,
            source=source,
        )
        self.todos.append(todo)
        self.storage.save(self.todos)
        return todo

    def list_todos(
        self,
        show_completed: bool | None = None,
        *,
        include_completed: bool = True,
    ) -> list[Todo]:
        """Return todos, optionally filtering out completed items.

        Args:
            show_completed: If `False`, return only active todos.

        Returns:
            List of todo objects.
        """

        effective_show_completed = include_completed if show_completed is None else show_completed
        if effective_show_completed:
            return list(self.todos)
        return [todo for todo in self.todos if not todo.completed]

    def finish_todo(self, todo_id: str, completed_at: str | None = None) -> Todo:
        """Mark a todo as completed and persist.

        Args:
            todo_id: ID of the todo to mark complete.

        Returns:
            Updated todo object.

        Raises:
            KeyError: If no todo with that ID exists.
        """

        todo = self._find(todo_id)
        todo.completed = True
        todo.updated_at = completed_at or datetime.utcnow().isoformat(timespec="seconds")
        self.storage.save(self.todos)
        return todo

    def complete_todo(self, todo_id: str) -> Todo:
        """Backward-compatible alias for finish_todo."""

        return self.finish_todo(todo_id)

    def delete_todo(self, todo_id: str) -> None:
        """Delete a todo by ID and persist.

        Args:
            todo_id: ID of the todo to remove.

        Raises:
            KeyError: If no todo with that ID exists.
        """

        before = len(self.todos)
        self.todos = [todo for todo in self.todos if todo.id != todo_id]
        if len(self.todos) == before:
            raise KeyError(f"Todo not found: {todo_id}")
        self.storage.save(self.todos)

    def overdue_todos(self) -> list[Todo]:
        """Return active todos with due dates earlier than today.

        Returns:
            List of overdue todos.
        """

        today = date.today().isoformat()
        return [
            todo
            for todo in self.todos
            if (not todo.completed) and todo.due_date is not None and todo.due_date < today
        ]

    def sort_by_priority(self, descending: bool = True) -> list[Todo]:
        """Return todos sorted by priority.

        Args:
            descending: If `True`, HIGH first; otherwise LOW first.

        Returns:
            New sorted list of todos.
        """

        rank = {
            Priority.LOW: 0,
            Priority.MEDIUM: 1,
            Priority.HIGH: 2,
            Priority.CRITICAL: 3,
        }
        return sorted(self.todos, key=lambda t: rank[t.priority], reverse=descending)

    def _find(self, todo_id: str) -> Todo:
        """Find todo by ID.

        Args:
            todo_id: Todo identifier.

        Returns:
            Matching todo.

        Raises:
            KeyError: If not found.
        """

        for todo in self.todos:
            if todo.id == todo_id:
                return todo
        raise KeyError(f"Todo not found: {todo_id}")
