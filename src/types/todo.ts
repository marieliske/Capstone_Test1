/** Priority levels for a Todo item, ordered from lowest to highest urgency. */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Core data model representing a single to-do item.
 *
 * Invariants:
 * - `id` is a non-empty, globally unique string (UUID v4).
 * - `title` is a trimmed, non-empty string of 1–80 characters.
 * - `createdAt` is set once at creation and never mutated.
 * - `updatedAt` is updated on every mutation (toggle, edit, etc.).
 * - `dueDate`, when present, is a valid ISO-8601 date string (YYYY-MM-DD).
 * - `priority` defaults to `"medium"` when not supplied by the user.
 */
export interface Todo {
  /** Unique identifier (UUID v4). */
  id: string;
  /** Display text of the task. Trimmed, 1–80 characters. */
  title: string;
  /** Whether the task has been completed. */
  completed: boolean;
  /** ISO-8601 timestamp of when the todo was created. */
  createdAt: string;
  /** ISO-8601 timestamp of the most recent mutation. */
  updatedAt: string;
  /** Optional ISO-8601 date string (YYYY-MM-DD) for the due date. */
  dueDate?: string;
  /** Urgency level. Defaults to `"medium"`. */
  priority: Priority;
}

/**
 * Input shape accepted when creating a new Todo.
 * Only user-provided fields; system fields (id, createdAt, updatedAt) are
 * generated automatically.
 */
export interface CreateTodoInput {
  /** Display text (1–80 chars, will be trimmed). */
  title: string;
  /** Urgency level. Defaults to `"medium"` if omitted. */
  priority?: Priority;
  /** Optional due date in YYYY-MM-DD format. */
  dueDate?: string;
}

/**
 * Partial update shape accepted by `updateTodo`.
 * All fields are optional; only supplied fields are changed.
 */
export type UpdateTodoInput = Partial<Pick<Todo, 'title' | 'completed' | 'priority' | 'dueDate'>>;

/** Available filter values for the list view. */
export type FilterMode = 'all' | 'active' | 'completed';

/**
 * Available sort modes for the list view.
 *
 * Tie-breaker rules (documented in useTodos and README):
 * - `created`   → newest `createdAt` first
 * - `dueDate`   → soonest due date first; todos without a due date are placed last;
 *                 ties broken by priority (high → medium → low) then `createdAt` (newest first)
 * - `priority`  → high → medium → low; ties broken by `createdAt` (newest first)
 */
export type SortMode = 'created' | 'dueDate' | 'priority';

/** Aggregate statistics derived from the current todo list. */
export interface TodoStats {
  /** Total number of todos. */
  total: number;
  /** Number of todos that are not yet completed. */
  active: number;
  /** Number of todos that are completed. */
  completed: number;
}
