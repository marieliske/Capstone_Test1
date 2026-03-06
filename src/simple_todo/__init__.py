"""Simple Todo package.

This package provides a lightweight todo management API with:
- dataclass-based todo model
- JSON-file persistence
- high-level service methods
- a small command-line interface
"""

from .models import Priority, Todo
from .service import TodoService

__all__ = ["Priority", "Todo", "TodoService"]
