import { useState, useMemo, useCallback } from 'react';
import type {
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
  FilterMode,
  SortMode,
  TodoStats,
} from '../types/todo';
import { generateId } from '../utils/id';
import { nowISO, compareDates } from '../utils/date';
import { validateTitle } from '../utils/validation';
import { loadTodos, saveTodos } from '../services/todosStorage';

// ---------------------------------------------------------------------------
// Priority ordering map (higher number = higher priority)
// ---------------------------------------------------------------------------
const PRIORITY_RANK: Record<Todo['priority'], number> = { low: 0, medium: 1, high: 2 };

// ---------------------------------------------------------------------------
// Demo seed data
// ---------------------------------------------------------------------------

/** Sample todos used by `resetDemoData()`. */
const DEMO_TODOS: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { title: 'Set up project repository', completed: true, priority: 'high', dueDate: '2025-01-10' },
  { title: 'Write project README', completed: false, priority: 'high', dueDate: '2025-02-01' },
  { title: 'Implement authentication', completed: false, priority: 'high', dueDate: '2025-03-15' },
  { title: 'Design database schema', completed: true, priority: 'medium', dueDate: '2025-01-20' },
  { title: 'Create UI wireframes', completed: false, priority: 'medium', dueDate: '2025-02-28' },
  { title: 'Write unit tests', completed: false, priority: 'medium' },
  { title: 'Set up CI/CD pipeline', completed: false, priority: 'low', dueDate: '2025-04-01' },
  { title: 'Conduct code review', completed: false, priority: 'low' },
];

/**
 * Builds the demo todo array with auto-generated ids and timestamps.
 *
 * Contract:
 * - Does not mutate `DEMO_TODOS`.
 * - Each returned Todo has a unique `id`.
 * - `createdAt` and `updatedAt` are set to the call time.
 *
 * @returns An array of fully-formed `Todo` objects.
 */
function buildDemoTodos(): Todo[] {
  return DEMO_TODOS.map((seed) => ({
    ...seed,
    id: generateId(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }));
}

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

/**
 * Compares two `Todo` objects according to the active `SortMode`.
 *
 * Tie-breaker rules:
 * - **created**: newest `createdAt` first (reverse-chronological).
 * - **dueDate**: soonest `dueDate` first; todos with no `dueDate` are placed
 *   last. Ties (same or both absent) broken by priority (high → low) then
 *   `createdAt` (newest first).
 * - **priority**: high → medium → low. Ties broken by `createdAt` (newest
 *   first).
 *
 * Contract:
 * - Does not mutate `a` or `b`.
 * - Returns a value usable directly in `Array.prototype.sort`.
 *
 * @param a    - First todo.
 * @param b    - Second todo.
 * @param mode - The active sort mode.
 * @returns A negative, zero, or positive number.
 */
function compareTodos(a: Todo, b: Todo, mode: SortMode): number {
  switch (mode) {
    case 'created':
      // Newest first → descending createdAt
      return b.createdAt.localeCompare(a.createdAt);

    case 'dueDate': {
      const dateDiff = compareDates(a.dueDate, b.dueDate);
      if (dateDiff !== 0) return dateDiff;
      // Tie-break 1: priority (high → low)
      const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Tie-break 2: newest createdAt first
      return b.createdAt.localeCompare(a.createdAt);
    }

    case 'priority': {
      const priorityDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Tie-break: newest createdAt first
      return b.createdAt.localeCompare(a.createdAt);
    }
  }
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

/** Full public API exposed by `useTodos`. */
export interface UseTodosReturn {
  // --- State ---
  /** The complete, unfiltered list of todos. */
  todos: Todo[];
  /** The active filter mode. */
  filter: FilterMode;
  /** The current search query string (case-insensitive substring match). */
  searchQuery: string;
  /** The active sort mode. */
  sortMode: SortMode;

  // --- Derived ---
  /**
   * The subset of todos that passes the current `filter`, `searchQuery`, and
   * sorted according to `sortMode`.
   */
  visibleTodos: Todo[];
  /** Aggregate counts over the full (unfiltered) todo list. */
  stats: TodoStats;

  // --- Actions ---
  /**
   * Creates a new todo from the supplied input.
   * @throws `Error` if the title fails validation (see `validateTitle`).
   */
  addTodo: (input: CreateTodoInput) => void;
  /**
   * Applies a partial patch to the todo identified by `id`.
   * Updates `updatedAt` automatically.
   * @throws `Error` if `patch.title` is supplied and fails validation.
   */
  updateTodo: (id: string, patch: UpdateTodoInput) => void;
  /**
   * Toggles the `completed` flag of the todo identified by `id`.
   * Updates `updatedAt` automatically.
   */
  toggleTodo: (id: string) => void;
  /** Removes the todo identified by `id` from the list. */
  deleteTodo: (id: string) => void;
  /** Updates the active filter mode. */
  setFilter: (filter: FilterMode) => void;
  /** Updates the search query (triggers re-filter on next render). */
  setSearchQuery: (query: string) => void;
  /** Updates the active sort mode. */
  setSortMode: (mode: SortMode) => void;
  /**
   * Replaces the current todo list with the built-in demo seed data and
   * persists it to `localStorage`.
   */
  resetDemoData: () => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Central state-management hook for the Todo List application.
 *
 * Loads persisted todos from `localStorage` on first render and automatically
 * saves after every mutation.  All filtering, searching, and sorting is
 * performed in a `useMemo` call so components always receive a stable,
 * up-to-date `visibleTodos` array.
 *
 * Contract:
 * - Must be called inside a React component or another hook.
 * - The `todos` state is the single source of truth; never mutate it directly.
 * - Every action that modifies todos also calls `saveTodos` to persist the
 *   change to `localStorage`.
 * - `addTodo` and `updateTodo` throw `Error` if title validation fails; callers
 *   are responsible for catching and displaying the error message.
 *
 * @returns The full `UseTodosReturn` API object.
 */
export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('created');

  // Helper: update state and persist in one step using functional updater
  const commitTodos = useCallback((updater: (prev: Todo[]) => Todo[]) => {
    setTodos((prev) => {
      const next = updater(prev);
      saveTodos(next);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const addTodo = useCallback(
    (input: CreateTodoInput) => {
      const result = validateTitle(input.title);
      if (!result.valid) throw new Error(result.error);
      const now = nowISO();
      const newTodo: Todo = {
        id: generateId(),
        title: result.value,
        completed: false,
        priority: input.priority ?? 'medium',
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
      };
      commitTodos((prev) => [...prev, newTodo]);
    },
    [commitTodos],
  );

  const updateTodo = useCallback(
    (id: string, patch: UpdateTodoInput) => {
      if (patch.title !== undefined) {
        const result = validateTitle(patch.title);
        if (!result.valid) throw new Error(result.error);
        patch = { ...patch, title: result.value };
      }
      const resolvedPatch = patch;
      commitTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...resolvedPatch, updatedAt: nowISO() } : t)),
      );
    },
    [commitTodos],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      commitTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed, updatedAt: nowISO() } : t,
        ),
      );
    },
    [commitTodos],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      commitTodos((prev) => prev.filter((t) => t.id !== id));
    },
    [commitTodos],
  );

  const resetDemoData = useCallback(() => {
    commitTodos(() => buildDemoTodos());
  }, [commitTodos]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const visibleTodos = useMemo(() => {
    let result = todos.slice(); // shallow copy; do not mutate original

    // Filter
    if (filter === 'active') result = result.filter((t) => !t.completed);
    else if (filter === 'completed') result = result.filter((t) => t.completed);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => compareTodos(a, b, sortMode));

    return result;
  }, [todos, filter, searchQuery, sortMode]);

  const stats = useMemo(() => {
    const completed = todos.filter((t) => t.completed).length;
    return { total: todos.length, active: todos.length - completed, completed };
  }, [todos]);

  return {
    todos,
    filter,
    searchQuery,
    sortMode,
    visibleTodos,
    stats,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    setFilter,
    setSearchQuery,
    setSortMode,
    resetDemoData,
  };
}
