from simple_todo.models import Priority
from simple_todo.service import TodoService
from simple_todo.storage import JsonTodoStorage


def test_add_and_list_todos(tmp_path):
    storage = JsonTodoStorage(tmp_path / "todos.json")
    service = TodoService(storage=storage)

    created = service.add_todo("Write docs", priority=Priority.HIGH, due_date="2026-03-10")

    all_todos = service.list_todos()
    assert len(all_todos) == 1
    assert all_todos[0].id == created.id
    assert all_todos[0].priority == Priority.HIGH


def test_complete_and_delete_todo(tmp_path):
    storage = JsonTodoStorage(tmp_path / "todos.json")
    service = TodoService(storage=storage)

    created = service.add_todo("Ship release")
    service.complete_todo(created.id)
    assert service.list_todos()[0].completed is True

    service.delete_todo(created.id)
    assert service.list_todos() == []


def test_summary_counts_and_priority_breakdown(tmp_path):
    storage = JsonTodoStorage(tmp_path / "todos.json")
    service = TodoService(storage=storage)

    low = service.add_todo("Low task", priority=Priority.LOW)
    service.add_todo("Medium task", priority=Priority.MEDIUM)
    high = service.add_todo("High task", priority=Priority.HIGH)
    service.add_todo("Critical task", priority=Priority.CRITICAL)
    service.complete_todo(high.id)
    service.complete_todo(low.id)

    summary = service.summary()
    assert summary["total"] == 4
    assert summary["completed"] == 2
    assert summary["active"] == 2
    assert summary["overdue"] == 0
    assert summary["by_priority"] == {
        "low": 1,
        "medium": 1,
        "high": 1,
        "critical": 1,
    }
