# Simple Todo Python Project

A lightweight todo application with a typed model, JSON persistence, a service layer, CLI commands, and tests.

## Contents

1. Setup
2. Run the CLI
3. Project Structure
4. Implementation Notes
5. Testing

## Setup

### Prerequisites

- Python 3.10+

### Install

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install project:

```bash
pip install -e .
```

Install with dev tools:

```bash
pip install -e .[dev]
```

## Run the CLI

The package installs a `todo` command from `simple_todo.cli:main`.

### Add

```bash
todo add "Write architecture notes"
todo add "Ship release" --priority high --due-date 2026-03-15 --source planning
```

Options:

- `--priority`: `low`, `medium`, `high`, `critical` (default: `low`)
- `--due-date`: optional `YYYY-MM-DD`
- `--source`: optional source tag (default: `manual`)

### List

```bash
todo list
todo list --active-only
todo ls
```

`ls` is an alias for `list`.

### Complete

```bash
todo done <TODO_ID>
todo complete <TODO_ID>
```

`done` and `complete` are equivalent.

### Delete

```bash
todo delete <TODO_ID>
todo remove <TODO_ID>
```

`delete` and `remove` are equivalent.

### Overdue

```bash
todo overdue
```

Shows incomplete todos with `due_date < today`.

## Project Structure

```
pyproject.toml
README.md
src/
  simple_todo/
    __init__.py
    cli.py
    models.py
    service.py
    storage.py
    validators.py
tests/
  test_service.py
```

## Implementation Notes

### Models (`simple_todo.models`)

- `Priority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `Todo` fields:
  - `id: str`
  - `title: str`
  - `completed: bool`
  - `priority: Priority`
  - `created_at: str`
  - `updated_at: str`
  - `due_date: str | None`
  - `source: str`

Core methods:

- `Todo.build(...)` creates records with timestamp defaults.
- `Todo.create(...)` is a backward-compatible alias.
- `Todo.as_dict(...)` / `Todo.to_dict()` serialize values.
- `Todo.from_mapping(...)` / `Todo.from_dict(...)` deserialize values.

### Validators (`simple_todo.validators`)

- `create_todo_id()` generates UUID4 strings.
- `generate_todo_id()` is a backward-compatible alias.
- `sanitize_title(text, max_length=80)` trims and validates title input.
- `normalize_title(...)` is a backward-compatible alias.
- `parse_due_date(due_date)` accepts `None`, empty string, `date`, or `YYYY-MM-DD` string.
- `validate_due_date(...)` is a backward-compatible alias.

### Storage (`simple_todo.storage`)

`JsonTodoStorage` reads/writes JSON in this format:

```json
{
  "version": 2,
  "saved_at": "2026-03-31T12:00:00",
  "todos": []
}
```

Behavior:

- `read_todos()` / `load()` returns `[]` if the file does not exist.
- Accepts schema versions `1` and `2` when reading.
- Raises `ValueError` for malformed JSON or unsupported schema.
- `write_todos()` / `save()` creates parent directories as needed.

### Service (`simple_todo.service`)

`TodoService` loads todos at initialization and persists changes on mutations.

Primary methods:

- `create_todo(text, priority=Priority.LOW, due_date=None, source="manual")`
- `list_todos(show_completed=None, include_completed=None, only_active=False)`
- `finish_todo(todo_id, completed_at=None)`
- `delete_todo(todo_id)`
- `list_overdue_todos()`
- `sort_by_priority(descending=True)`

Backward-compatible aliases:

- `add_todo(...)` -> `create_todo(...)`
- `complete_todo(todo_id)` -> `finish_todo(todo_id)`
- `overdue_todos()` -> `list_overdue_todos()`
- `_find(todo_id)` -> `_get_todo_or_raise(todo_id)`

## Testing

Run tests:

```bash
pytest
```

Current tests in `tests/test_service.py` cover:

- add + list flow
- complete + delete flow

BLEHHHHHHHHHH
