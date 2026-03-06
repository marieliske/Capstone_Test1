import React, { useState, useRef, useEffect } from 'react';
import type { Todo, Priority } from '../types/todo';
import { formatDate, isOverdue } from '../utils/date';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Todo, 'title' | 'priority' | 'dueDate'>>) => void;
  onDelete: (id: string) => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Med', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', className: 'bg-green-100 text-green-700' },
  urgent: { label: 'Urgent', className: 'bg-purple-100 text-purple-700' },
};

/**
 * Renders a single todo row with inline editing, toggle, and delete actions.
 *
 * - Double-clicking the title activates inline edit mode.
 * - Pressing Enter or blurring the inline input commits the edit.
 * - Pressing Escape cancels without saving.
 */
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editPriority, setEditPriority] = useState<Priority>(todo.priority);
  const [editDueDate, setEditDueDate] = useState(todo.dueDate ?? '');
  const [showEditForm, setShowEditForm] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) editInputRef.current?.focus();
  }, [isEditing]);

  const commitTitleEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      onUpdate(todo.id, { title: trimmed });
    }
    setEditTitle(todo.title); // reset to current (will reflect update on next render)
    setIsEditing(false);
  };

  const cancelTitleEdit = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const commitFieldEdit = () => {
    onUpdate(todo.id, {
      priority: editPriority,
      dueDate: editDueDate || undefined,
    });
    setShowEditForm(false);
  };

  const overdue = !todo.completed && isOverdue(todo.dueDate);
  const pc = priorityConfig[todo.priority];

  return (
    <li className={`group flex flex-col gap-2 p-3 rounded-lg border transition-colors ${todo.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400 cursor-pointer shrink-0"
        />

        {/* Title area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              maxLength={80}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitleEdit();
                if (e.key === 'Escape') cancelTitleEdit();
              }}
              aria-label="Edit todo title"
              className="w-full text-sm border-b border-blue-400 outline-none bg-transparent pb-0.5"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setEditTitle(todo.title);
                setIsEditing(true);
              }}
              title="Double-click to edit"
              className={`text-sm break-words cursor-default select-none ${
                todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            >
              {todo.title}
            </span>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${pc.className}`}
              aria-label={`Priority: ${pc.label}`}
            >
              {pc.label}
            </span>
            {todo.dueDate && (
              <span
                className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}
                aria-label={`Due: ${formatDate(todo.dueDate)}${overdue ? ' (overdue)' : ''}`}
              >
                {overdue ? '⚠ ' : ''}Due {formatDate(todo.dueDate)}
              </span>
            )}
            <span className="text-xs text-gray-300" aria-label={`Created: ${formatDate(todo.createdAt)}`}>
              {formatDate(todo.createdAt)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditPriority(todo.priority);
              setEditDueDate(todo.dueDate ?? '');
              setShowEditForm((v) => !v);
            }}
            aria-label={`Edit "${todo.title}"`}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {/* Pencil icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete "${todo.title}"`}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {/* Trash icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Inline edit form for priority + due date */}
      {showEditForm && (
        <div className="flex gap-3 pl-7 flex-wrap items-end">
          <div className="flex items-center gap-1.5">
            <label htmlFor={`priority-${todo.id}`} className="text-xs text-gray-500">Priority</label>
            <select
              id={`priority-${todo.id}`}
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
              className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor={`due-${todo.id}`} className="text-xs text-gray-500">Due</label>
            <input
              id={`due-${todo.id}`}
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={commitFieldEdit}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowEditForm(false)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
};
