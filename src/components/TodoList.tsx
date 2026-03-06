import React, { useState } from 'react';
import type { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';
import { ConfirmDialog } from './ConfirmDialog';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Todo, 'title' | 'priority' | 'dueDate'>>) => void;
  onDelete: (id: string) => void;
}

/**
 * Renders the ordered list of visible todos.
 *
 * Manages the confirm-before-delete dialog state locally so that the parent
 * hook does not need to track pending deletions.
 */
export const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onUpdate, onDelete }) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDeleteRequest = (id: string) => {
    setPendingDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) onDelete(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  if (todos.length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm py-12" role="status">
        No todos yet. Add one above.
      </p>
    );
  }

  const pendingTitle = todos.find((t) => t.id === pendingDeleteId)?.title;

  return (
    <>
      <ol aria-label="Todo list" className="flex flex-col gap-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={handleDeleteRequest}
          />
        ))}
      </ol>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        message={`Delete "${pendingTitle ?? ''}"? This cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};
