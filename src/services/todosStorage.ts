import type { Todo } from '../types/todo';

/**
 * Versioned envelope stored in `localStorage`.
 *
 * Schema version history:
 * - **v1** (current): `{ version: 1, savedAt: string, todos: Todo[] }`
 *
 * When loading, the code checks `envelope.version`. If the version is unknown
 * or the data is malformed, the load returns an empty array and the bad data
 * is left untouched (i.e. not overwritten until the next save).
 */
export type TodosStorageEnvelope = {
  /** Schema version discriminant. Must be `1` for the current format. */
  version: 1;
  /** ISO-8601 timestamp of the last successful save. */
  savedAt: string;
  /** The serialised todo array. */
  todos: Todo[];
};

/** Key used to read/write the envelope in `localStorage`. */
const STORAGE_KEY = 'todo-list-app:todos';

/**
 * Loads todos from `localStorage`.
 *
 * Contract:
 * - Does not mutate any React state directly; returns a plain array.
 * - Returns an empty array if the key is absent, unreadable, or the envelope
 *   version is not `1`.
 * - Does not throw; all errors are swallowed and logged to the console.
 *
 * @returns The stored `Todo[]`, or `[]` on any error.
 */
export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const envelope = JSON.parse(raw) as unknown;
    if (
      typeof envelope !== 'object' ||
      envelope === null ||
      (envelope as TodosStorageEnvelope).version !== 1
    ) {
      console.warn('[todosStorage] Unknown envelope version; ignoring stored data.');
      return [];
    }
    return (envelope as TodosStorageEnvelope).todos ?? [];
  } catch (err) {
    console.error('[todosStorage] Failed to load todos:', err);
    return [];
  }
}

/**
 * Persists todos to `localStorage` inside a versioned envelope.
 *
 * Contract:
 * - Does not mutate the `todos` array.
 * - Overwrites any previously stored value at `STORAGE_KEY`.
 * - Does not throw; storage errors are swallowed and logged.
 * - Sets `savedAt` to the current UTC time at the moment of the call.
 *
 * @param todos - The current todo array to persist.
 */
export function saveTodos(todos: Todo[]): void {
  try {
    const envelope: TodosStorageEnvelope = {
      version: 1,
      savedAt: new Date().toISOString(),
      todos,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (err) {
    console.error('[todosStorage] Failed to save todos:', err);
  }
}

/**
 * Removes all todo data from `localStorage`.
 *
 * Contract:
 * - Does not throw; errors are swallowed and logged.
 * - After this call, `loadTodos()` will return `[]`.
 */
export function clearTodos(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[todosStorage] Failed to clear todos:', err);
  }
}
