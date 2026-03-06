import React, { useState, useRef, useEffect } from 'react';
import type { Priority } from '../types/todo';
import { validateTitle } from '../utils/validation';

interface TodoFormProps {
  /** Called with validated input when the form is submitted. */
  onAdd: (title: string, priority: Priority, dueDate?: string) => void;
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

/**
 * Controlled form for creating a new todo.
 *
 * - Submits on Enter key or button click.
 * - Clears fields on successful submission.
 * - Displays inline validation errors without submitting.
 * - Priority defaults to "medium".
 */
export const TodoForm: React.FC<TodoFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateTitle(title);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    setError('');
    onAdd(result.value, priority, dueDate || undefined);
    setTitle('');
    setPriority('medium');
    setDueDate('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Add new todo">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="Add a new todo…"
            maxLength={100}
            aria-label="Todo title"
            aria-describedby={error ? 'title-error' : undefined}
            aria-invalid={!!error}
            className={`flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors
              ${error
                ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                : 'border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
              } bg-white`}
          />
          <button
            type="submit"
            aria-label="Add todo"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 shrink-0"
          >
            Add
          </button>
        </div>

        {error && (
          <p id="title-error" role="alert" className="text-red-600 text-xs px-1">
            {error}
          </p>
        )}

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="todo-priority" className="text-xs text-gray-500 font-medium">
              Priority
            </label>
            <select
              id="todo-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="todo-due" className="text-xs text-gray-500 font-medium">
              Due date
            </label>
            <input
              id="todo-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Due date (optional)"
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
