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
