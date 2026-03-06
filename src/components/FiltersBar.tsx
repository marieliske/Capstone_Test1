import React from 'react';
import type { FilterMode, SortMode } from '../types/todo';

interface FiltersBarProps {
  filter: FilterMode;
  searchQuery: string;
  sortMode: SortMode;
  onFilterChange: (f: FilterMode) => void;
  onSearchChange: (q: string) => void;
  onSortChange: (s: SortMode) => void;
}

const filterOptions: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'created', label: 'Created (newest first)' },
  { value: 'deadline', label: 'Deadline (soonest first)' },
  { value: 'priority', label: 'Priority (high → low)' },
];

/**
 * Renders the filter tabs, search input, and sort dropdown above the todo list.
 */
export const FiltersBar: React.FC<FiltersBarProps> = ({
  filter,
  searchQuery,
  sortMode,
  onFilterChange,
  onSearchChange,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Filter tabs */}
      <div role="tablist" aria-label="Filter todos" className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            role="tab"
            aria-selected={filter === opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
              ${filter === opt.value
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search + Sort row */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search todos…"
          aria-label="Search todos"
          className="flex-1 min-w-[160px] px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        />
        <select
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          aria-label="Sort todos"
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
