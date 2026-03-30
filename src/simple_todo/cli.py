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
    add_cmd.add_argument("--priority", choices=["low", "medium", "high", "critical"], default="low")
    add_cmd.add_argument("--due-date", default=None, help="Due date in YYYY-MM-DD")
    add_cmd.add_argument("--source", default="manual", help="Source tag for the todo")

    list_cmd = sub.add_parser("list", help="List all todos")
    list_cmd.add_argument("--active-only", action="store_true", help="Show only active todos")

    sub.add_parser("ls", help="Alias for list")

    done_cmd = sub.add_parser("done", help="Mark todo as completed")
    done_cmd.add_argument("id", help="Todo ID")

    complete_cmd = sub.add_parser("complete", help="Mark todo as completed")
    complete_cmd.add_argument("id", help="Todo ID")

    del_cmd = sub.add_parser("delete", help="Delete a todo")
    del_cmd.add_argument("id", help="Todo ID")

    rm_cmd = sub.add_parser("remove", help="Delete a todo")
    rm_cmd.add_argument("id", help="Todo ID")

    sub.add_parser("overdue", help="List overdue todos")
    sub.add_parser("summary", help="Show todo summary statistics")
    return parser


def main() -> None:
    """Run CLI command dispatcher."""

    args = build_parser().parse_args()
    service = TodoService()

    if args.command == "add":
        todo = service.create_todo(
            args.title,
            priority=Priority(args.priority),
            due_date=args.due_date,
            source=args.source,
        )
        print(f"Added: {todo.id} | {todo.title} | {todo.priority.value}")
        return

    if args.command in {"list", "ls"}:
        include_completed = not getattr(args, "active_only", False)
        todos = service.list_todos(include_completed=include_completed)
        if not todos:
            print("No todos yet.")
            return
        for todo in todos:
            status = "x" if todo.completed else " "
            due = f" | due {todo.due_date}" if todo.due_date else ""
            print(f"[{status}] {todo.id} | {todo.title} | {todo.priority.value}{due}")
        return

    if args.command in {"done", "complete"}:
        service.finish_todo(args.id)
        print(f"Completed: {args.id}")
        return

    if args.command in {"delete", "remove"}:
        service.delete_todo(args.id)
        print(f"Deleted: {args.id}")
        return

    if args.command == "overdue":
        overdue = service.list_overdue_todos()
        if not overdue:
            print("No overdue todos.")
            return
        for todo in overdue:
            print(f"{todo.id} | {todo.title} | due {todo.due_date}")
        return

    if args.command == "summary":
        data = service.summary()
        by_priority = data["by_priority"]
        print(
            "Summary: "
            f"total={data['total']} "
            f"active={data['active']} "
            f"completed={data['completed']} "
            f"overdue={data['overdue']}"
        )
        print(
            "By priority: "
            f"low={by_priority['low']} "
            f"medium={by_priority['medium']} "
            f"high={by_priority['high']} "
            f"critical={by_priority['critical']}"
        )


if __name__ == "__main__":
    main()
