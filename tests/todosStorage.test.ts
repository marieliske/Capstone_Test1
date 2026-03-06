import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, clearTodos } from '../src/services/todosStorage';
import type { Todo } from '../src/types/todo';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'test-id',
  title: 'Test todo',
  completed: false,
  priority: 'medium',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('todosStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadTodos', () => {
    it('returns [] when localStorage is empty', () => {
      expect(loadTodos()).toEqual([]);
    });

    it('returns stored todos from a valid v1 envelope', () => {
      const todos = [makeTodo({ id: '1' }), makeTodo({ id: '2', title: 'Another' })];
      const envelope = { version: 1, savedAt: '2025-01-01T00:00:00.000Z', todos };
      localStorage.setItem('todo-list-app:todos', JSON.stringify(envelope));
      expect(loadTodos()).toEqual(todos);
    });

    it('returns [] and logs a warning for an unknown version', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const badEnvelope = { version: 99, savedAt: '2025-01-01T00:00:00.000Z', todos: [] };
      localStorage.setItem('todo-list-app:todos', JSON.stringify(badEnvelope));
      const result = loadTodos();
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });

    it('returns [] and logs an error for malformed JSON', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('todo-list-app:todos', 'not-valid-json{{{');
      expect(loadTodos()).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });

    it('returns [] when envelope is null', () => {
      localStorage.setItem('todo-list-app:todos', 'null');
      expect(loadTodos()).toEqual([]);
    });
  });

  describe('saveTodos', () => {
    it('persists a versioned envelope to localStorage', () => {
      const todos = [makeTodo()];
      saveTodos(todos);
      const raw = localStorage.getItem('todo-list-app:todos');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(1);
      expect(parsed.todos).toEqual(todos);
      expect(typeof parsed.savedAt).toBe('string');
    });

    it('round-trips correctly: save then load returns the same array', () => {
      const todos = [makeTodo({ id: 'abc', title: 'Round trip' })];
      saveTodos(todos);
      expect(loadTodos()).toEqual(todos);
    });

    it('does not mutate the input array', () => {
      const todos = [makeTodo()];
      const copy = [...todos];
      saveTodos(todos);
      expect(todos).toEqual(copy);
    });
  });

  describe('clearTodos', () => {
    it('removes the stored todos key', () => {
      saveTodos([makeTodo()]);
      clearTodos();
      expect(localStorage.getItem('todo-list-app:todos')).toBeNull();
    });

    it('makes subsequent loadTodos return []', () => {
      saveTodos([makeTodo()]);
      clearTodos();
      expect(loadTodos()).toEqual([]);
    });
  });
});
