"""Business logic for managing todos."""

from __future__ import annotations

from datetime import date, datetime

from .models import Priority, Todo
from .storage import JsonTodoStorage
from .validators import create_todo_id, parse_due_date, sanitize_title


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

    def create_todo(
        self,
        text: str,
        *,
        priority: Priority = Priority.LOW,
        due_date: str | None = None,
        source: str = "manual",
    ) -> Todo:
        """Create and persist a new todo.

        Args:
            text: Human-readable task title.
            priority: Priority enum value.
            due_date: Optional due date in YYYY-MM-DD format.
            source: Optional source tag.

        Returns:
            The created todo object.
        """

        clean_title = sanitize_title(text)
        clean_due_date = parse_due_date(due_date)
        todo = Todo.build(
            create_todo_id(),
            clean_title,
            priority=priority,
            due_date=clean_due_date,
            source=source,
        )
        self.todos.append(todo)
        self.storage.save(self.todos)
        return todo

    def add_todo(
        self,
        title: str,
        priority: Priority = Priority.LOW,
        due_date: str | None = None,
        source: str = "manual",
    ) -> Todo:
        """Backward-compatible alias for create_todo."""

        return self.create_todo(
            title,
            priority=priority,
            due_date=due_date,
            source=source,
        )

    def list_todos(
        self,
        show_completed: bool | None = None,
        *,
        include_completed: bool | None = None,
        only_active: bool = False,
    ) -> list[Todo]:
        """Return todos, optionally filtering out completed items.

        Args:
            show_completed: Legacy toggle. If `False`, return only active todos.
            include_completed: Preferred toggle. If `False`, return only active todos.
            only_active: If `True`, return only active todos.

        Returns:
            List of todo objects.
        """

        include_completed_flag = show_completed if include_completed is None else include_completed

        if only_active or include_completed_flag is False:
            return [todo for todo in self.todos if not todo.completed]

        # Return a shallow copy to avoid external mutation of internal state.
        return list(self.todos)

    def finish_todo(self, todo_id: str, completed_at: str | None = None) -> Todo:
        """Mark a todo as completed and persist.

        Args:
            todo_id: ID of the todo to mark complete.

        Returns:
            Updated todo object.

        Raises:
            KeyError: If no todo with that ID exists.
        """

        todo = self._get_todo_or_raise(todo_id)
        was_completed = todo.completed
        if not was_completed:
            todo.completed = True

        if completed_at is not None:
            todo.updated_at = completed_at
        elif not was_completed:
            todo.updated_at = datetime.utcnow().isoformat(timespec="seconds")

        if (not was_completed) or (completed_at is not None):
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

    def list_overdue_todos(self) -> list[Todo]:
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

    def overdue_todos(self) -> list[Todo]:
        """Backward-compatible alias for list_overdue_todos."""

        return self.list_overdue_todos()

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
        return sorted(
            self.todos,
            key=lambda t: (
                rank[t.priority],
                t.due_date or "9999-12-31",
                t.id,
            ),
            reverse=descending,
        )

    def _get_todo_or_raise(self, todo_id: str) -> Todo:
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

    def _find(self, todo_id: str) -> Todo:
        """Backward-compatible alias for _get_todo_or_raise."""

        return self._get_todo_or_raise(todo_id)
