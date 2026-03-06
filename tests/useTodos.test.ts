import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from '../src/hooks/useTodos';

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initialises with an empty todo list', () => {
    const { result } = renderHook(() => useTodos());
    expect(result.current.todos).toEqual([]);
    expect(result.current.stats).toEqual({ total: 0, active: 0, completed: 0 });
  });

  describe('addTodo', () => {
    it('adds a todo with the given title', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Buy milk' }));
      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('Buy milk');
    });

    it('trims whitespace from the title', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: '  Buy milk  ' }));
      expect(result.current.todos[0].title).toBe('Buy milk');
    });

    it('defaults priority to "medium"', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Task' }));
      expect(result.current.todos[0].priority).toBe('medium');
    });

    it('uses supplied priority', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Urgent', priority: 'high' }));
      expect(result.current.todos[0].priority).toBe('high');
    });

    it('throws for an empty title', () => {
      const { result } = renderHook(() => useTodos());
      expect(() => act(() => result.current.addTodo({ title: '' }))).toThrow();
    });

    it('throws for a whitespace-only title', () => {
      const { result } = renderHook(() => useTodos());
      expect(() => act(() => result.current.addTodo({ title: '   ' }))).toThrow();
    });

    it('throws for a title exceeding 80 characters', () => {
      const { result } = renderHook(() => useTodos());
      expect(() =>
        act(() => result.current.addTodo({ title: 'a'.repeat(81) })),
      ).toThrow();
    });

    it('persists to localStorage after add', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Persisted' }));
      const raw = localStorage.getItem('todo-list-app:todos');
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!).todos[0].title).toBe('Persisted');
    });
  });

  describe('toggleTodo', () => {
    it('marks an active todo as completed', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Toggle me' }));
      const id = result.current.todos[0].id;
      act(() => result.current.toggleTodo(id));
      expect(result.current.todos[0].completed).toBe(true);
    });

    it('marks a completed todo as active', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Toggle me' }));
      const id = result.current.todos[0].id;
      act(() => result.current.toggleTodo(id));
      act(() => result.current.toggleTodo(id));
      expect(result.current.todos[0].completed).toBe(false);
    });
  });

  describe('updateTodo', () => {
    it('updates the title', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Old title' }));
      const id = result.current.todos[0].id;
      act(() => result.current.updateTodo(id, { title: 'New title' }));
      expect(result.current.todos[0].title).toBe('New title');
    });

    it('throws for an invalid title patch', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Valid' }));
      const id = result.current.todos[0].id;
      expect(() => act(() => result.current.updateTodo(id, { title: '' }))).toThrow();
    });

    it('updates updatedAt on change', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Check time' }));
      const { id, updatedAt } = result.current.todos[0];
      // Advance time so the new updatedAt timestamp differs
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);
      act(() => result.current.updateTodo(id, { priority: 'high' }));
      vi.useRealTimers();
      expect(result.current.todos[0].updatedAt).not.toBe(updatedAt);
    });
  });

  describe('deleteTodo', () => {
    it('removes the todo from the list', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'To be deleted' }));
      const id = result.current.todos[0].id;
      act(() => result.current.deleteTodo(id));
      expect(result.current.todos).toHaveLength(0);
    });
  });

  describe('stats', () => {
    it('computes correct stats', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'A' }));
      act(() => result.current.addTodo({ title: 'B' }));
      act(() => result.current.addTodo({ title: 'C' }));
      const id = result.current.todos[0].id;
      act(() => result.current.toggleTodo(id));
      expect(result.current.stats).toEqual({ total: 3, active: 2, completed: 1 });
    });
  });

  describe('filter', () => {
    it('shows only active todos when filter is "active"', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'A' }));
      act(() => result.current.addTodo({ title: 'B' }));
      const id = result.current.todos[0].id;
      act(() => result.current.toggleTodo(id));
      act(() => result.current.setFilter('active'));
      expect(result.current.visibleTodos).toHaveLength(1);
      expect(result.current.visibleTodos[0].completed).toBe(false);
    });

    it('shows only completed todos when filter is "completed"', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'A' }));
      act(() => result.current.addTodo({ title: 'B' }));
      const id = result.current.todos[0].id;
      act(() => result.current.toggleTodo(id));
      act(() => result.current.setFilter('completed'));
      expect(result.current.visibleTodos).toHaveLength(1);
      expect(result.current.visibleTodos[0].completed).toBe(true);
    });
  });

  describe('searchQuery', () => {
    it('filters todos by case-insensitive substring', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Buy milk' }));
      act(() => result.current.addTodo({ title: 'Walk dog' }));
      act(() => result.current.setSearchQuery('MILK'));
      expect(result.current.visibleTodos).toHaveLength(1);
      expect(result.current.visibleTodos[0].title).toBe('Buy milk');
    });
  });

  describe('resetDemoData', () => {
    it('replaces todos with demo data', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'My custom task' }));
      act(() => result.current.resetDemoData());
      expect(result.current.todos.length).toBeGreaterThan(1);
      // Demo data should not contain the custom task
      expect(result.current.todos.find((t) => t.title === 'My custom task')).toBeUndefined();
    });
  });

  describe('sorting', () => {
    it('sorts by priority: high before medium before low', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Low', priority: 'low' }));
      act(() => result.current.addTodo({ title: 'High', priority: 'high' }));
      act(() => result.current.addTodo({ title: 'Med', priority: 'medium' }));
      act(() => result.current.setSortMode('priority'));
      const titles = result.current.visibleTodos.map((t) => t.title);
      expect(titles[0]).toBe('High');
      expect(titles[1]).toBe('Med');
      expect(titles[2]).toBe('Low');
    });

    it('sorts by dueDate: soonest first, undated last', () => {
      const { result } = renderHook(() => useTodos());
      act(() => result.current.addTodo({ title: 'Later', dueDate: '2025-12-31' }));
      act(() => result.current.addTodo({ title: 'No date' }));
      act(() => result.current.addTodo({ title: 'Soon', dueDate: '2025-01-01' }));
      act(() => result.current.setSortMode('dueDate'));
      const titles = result.current.visibleTodos.map((t) => t.title);
      expect(titles[0]).toBe('Soon');
      expect(titles[1]).toBe('Later');
      expect(titles[2]).toBe('No date');
    });
  });
});
