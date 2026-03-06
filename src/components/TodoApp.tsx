import React from 'react';
import { useTodos } from '../hooks/useTodos';
import { TodoForm } from './TodoForm';
import { FiltersBar } from './FiltersBar';
import { TodoList } from './TodoList';
import type { Priority } from '../types/todo';

/**
 * Root application component.
 *
 * Owns no state directly — all state is managed by `useTodos` and passed down
 * as props. Components below this level are purely presentational.
 */
export const TodoApp: React.FC = () => {
  const {
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
  } = useTodos();

  const handleAdd = (title: string, priority: Priority, dueDate?: string) => {
    try {
      addTodo({ title, priority, dueDate });
    } catch {
      // validation errors are surfaced by TodoForm internally
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Todos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats.total === 0
              ? 'No todos yet'
              : `${stats.active} active · ${stats.completed} completed · ${stats.total} total`}
          </p>
        </header>

        {/* Main card */}
        <main className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-5">
          {/* Add todo form */}
          <section aria-label="Add todo">
            <TodoForm onAdd={handleAdd} />
          </section>

          <hr className="border-gray-100" />

          {/* Filters + sort */}
          <section aria-label="Filters and sort">
            <FiltersBar
              filter={filter}
              searchQuery={searchQuery}
              sortMode={sortMode}
              onFilterChange={setFilter}
              onSearchChange={setSearchQuery}
              onSortChange={setSortMode}
            />
          </section>

          {/* Todo list */}
          <section aria-label="Todo list">
            <TodoList
              todos={visibleTodos}
              onToggle={toggleTodo}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-4 text-center">
          <button
            type="button"
            onClick={resetDemoData}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
            aria-label="Reset to demo data"
          >
            Reset Demo Data
          </button>
        </footer>
      </div>
    </div>
  );
};
