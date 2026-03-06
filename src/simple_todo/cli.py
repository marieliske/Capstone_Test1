"""Command-line interface for the simple todo project."""

from __future__ import annotations

import argparse

from .models import Priority
from .service import TodoService


def build_parser() -> argparse.ArgumentParser:
    """Create and configure CLI argument parser.

    Returns:
        Configured parser instance.
    """

    parser = argparse.ArgumentParser(description="Simple Todo CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    add_cmd = sub.add_parser("add", help="Add a new todo")
    add_cmd.add_argument("title", help="Todo title")
    add_cmd.add_argument("--priority", choices=["low", "medium", "high"], default="medium")
    add_cmd.add_argument("--due-date", default=None, help="Due date in YYYY-MM-DD")

    sub.add_parser("list", help="List all todos")

    done_cmd = sub.add_parser("done", help="Mark todo as completed")
    done_cmd.add_argument("id", help="Todo ID")

    del_cmd = sub.add_parser("delete", help="Delete a todo")
    del_cmd.add_argument("id", help="Todo ID")

    sub.add_parser("overdue", help="List overdue todos")
    return parser


def main() -> None:
    """Run CLI command dispatcher."""

    args = build_parser().parse_args()
    service = TodoService()

    if args.command == "add":
        todo = service.add_todo(
            title=args.title,
            priority=Priority(args.priority),
            due_date=args.due_date,
        )
        print(f"Added: {todo.id} | {todo.title} | {todo.priority.value}")
        return

    if args.command == "list":
        todos = service.list_todos(show_completed=True)
        if not todos:
            print("No todos yet.")
            return
        for todo in todos:
            status = "x" if todo.completed else " "
            due = f" | due {todo.due_date}" if todo.due_date else ""
            print(f"[{status}] {todo.id} | {todo.title} | {todo.priority.value}{due}")
        return

    if args.command == "done":
        service.complete_todo(args.id)
        print(f"Completed: {args.id}")
        return

    if args.command == "delete":
        service.delete_todo(args.id)
        print(f"Deleted: {args.id}")
        return

    if args.command == "overdue":
        overdue = service.overdue_todos()
        if not overdue:
            print("No overdue todos.")
            return
        for todo in overdue:
            print(f"{todo.id} | {todo.title} | due {todo.due_date}")


if __name__ == "__main__":
    main()
