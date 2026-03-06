# Todo List App

A minimal, modern, and fully accessible to-do list application built with React, TypeScript, and Vite. Designed to serve as a clean, intentionally well-documented reference codebase for testing **Documentation Rot Detection** tooling.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Run Instructions](#run-instructions)
3. [Architecture Overview](#architecture-overview)
4. [Data Model](#data-model)
5. [Function Documentation Index](#function-documentation-index)
6. [Behavior Contracts](#behavior-contracts)
   - [Validation Rules](#validation-rules)
   - [Sorting Rules and Tie-Breakers](#sorting-rules-and-tie-breakers)
   - [Storage Behavior and Schema Versioning](#storage-behavior-and-schema-versioning)
7. [DocRot Test Ideas](#docrot-test-ideas)

---

## Project Overview

**What it is:** A single-page to-do list application with CRUD operations, filtering, search, sorting, and automatic `localStorage` persistence. The app lets users create, view, edit, complete, and delete tasks with optional priorities and due dates.

**Why it exists:** This repo is purpose-built to act as a stable, heavily-documented test fixture for a **Documentation Rot Detector** — a tool that identifies drift between in-code documentation (JSDoc/TSDoc) and the README, and between documentation and actual implementation.

Every exported function carries JSDoc with explicit contracts, invariants, and behavior descriptions. The README mirrors those contracts. This deliberate redundancy makes doc/code drift easy to detect and reproduce.

---

## Run Instructions

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install

```bash
npm install
```

### Development server

```bash
npm run dev
```

Opens at `http://localhost:5173` by default.

### Tests

```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Lint

```bash
npm run lint
```

---

## Architecture Overview

```
/
├── index.html              # HTML shell
├── vite.config.ts          # Vite + Vitest configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript project references
└── src/
    ├── main.tsx            # React DOM bootstrap
    ├── App.tsx             # Root component (thin wrapper)
    ├── index.css           # Tailwind directives
    ├── types/
    │   └── todo.ts         # All shared TypeScript interfaces & type aliases
    ├── utils/
    │   ├── id.ts           # UUID generation
    │   ├── date.ts         # Date formatting and comparison helpers
    │   └── validation.ts   # Title validation logic and constants
    ├── services/
    │   └── todosStorage.ts # localStorage read/write with versioned envelope
    ├── hooks/
    │   ├── useLocalStorage.ts  # Generic key-value localStorage hook
    │   └── useTodos.ts         # Central state-management hook (all CRUD + derived state)
    └── components/
        ├── TodoApp.tsx      # Root UI component; wires hook to presentation
        ├── TodoForm.tsx     # Controlled form for creating a new todo
        ├── FiltersBar.tsx   # Filter tabs, search input, and sort dropdown
        ├── TodoList.tsx     # Ordered list of TodoItem rows + delete-confirm dialog
        ├── TodoItem.tsx     # Single todo row with inline edit, toggle, delete
        └── ConfirmDialog.tsx # Accessible modal for confirming destructive actions
```

### Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `types/` | Single source of truth for all TypeScript types and interfaces. No logic, no imports. |
| `utils/` | Pure, stateless helper functions. No React, no side-effects. |
| `services/` | I/O boundary. Owns all direct `localStorage` access. |
| `hooks/` | React state and derived state. Calls services and utils; no JSX. |
| `components/` | Presentational React components. Call hook actions; own no persistent state. |

---

## Data Model

### `Todo`

Defined in `src/types/todo.ts`.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✓ | UUID v4. Unique, immutable after creation. |
| `title` | `string` | ✓ | Trimmed, 1–80 characters. |
| `completed` | `boolean` | ✓ | `false` at creation; toggled by the user. |
| `createdAt` | `string` | ✓ | ISO-8601 timestamp. Set once at creation; never mutated. |
| `updatedAt` | `string` | ✓ | ISO-8601 timestamp. Updated on every mutation. |
| `dueDate` | `string` | – | Optional YYYY-MM-DD date string. |
| `priority` | `"low" \| "medium" \| "high"` | ✓ | Defaults to `"medium"` when not provided. |

**Invariants:**
- `id` is globally unique within a session and across restores from `localStorage`.
- `title` is always stored trimmed (no leading/trailing whitespace).
- `createdAt ≤ updatedAt` (both are ISO strings so string comparison is valid).
- `dueDate`, when present, is a valid calendar date in YYYY-MM-DD format.
- `priority` is always one of the three literal values; no other strings are valid.

### `TodosStorageEnvelope`

The shape of the JSON object written to `localStorage` key `todo-list-app:todos`.

```ts
type TodosStorageEnvelope = {
  version: 1;       // Schema discriminant. Must be 1.
  savedAt: string;  // ISO-8601 timestamp of last save.
  todos: Todo[];    // The serialised todo array.
};
```

---

## Function Documentation Index

All exported functions with their locations, signatures, and descriptions.

### `src/utils/id.ts`

| Name | Signature | Description |
|---|---|---|
| `generateId` | `() => string` | Returns a RFC-4122 UUID v4 string. Uses `crypto.randomUUID()` when available; falls back to a manual implementation. |

### `src/utils/date.ts`

| Name | Signature | Description |
|---|---|---|
| `nowISO` | `() => string` | Returns the current UTC time as an ISO-8601 string. |
| `formatDate` | `(iso: string) => string` | Formats an ISO timestamp into a short locale-aware date string (e.g. "Jan 15, 2025"). Returns "Invalid date" for unparseable input. |
| `compareDates` | `(a: string \| undefined, b: string \| undefined) => number` | Comparator for optional ISO date strings. `undefined` values sort last. |
| `isOverdue` | `(iso: string \| undefined) => boolean` | Returns `true` when the given date is strictly before today. |

### `src/utils/validation.ts`

| Name | Signature | Description |
|---|---|---|
| `validateTitle` | `(raw: string) => { valid: true; value: string } \| { valid: false; error: string }` | Validates and trims a todo title. Returns a discriminated union. |
| `isValidDateString` | `(value: string) => boolean` | Returns `true` for valid YYYY-MM-DD calendar date strings. |
| `TITLE_MAX_LENGTH` | `80` (constant) | Maximum number of characters allowed in a title after trimming. |
| `TITLE_MIN_LENGTH` | `1` (constant) | Minimum number of characters required in a title after trimming. |

### `src/services/todosStorage.ts`

| Name | Signature | Description |
|---|---|---|
| `loadTodos` | `() => Todo[]` | Reads and parses todos from `localStorage`. Returns `[]` on any error or unknown schema version. |
| `saveTodos` | `(todos: Todo[]) => void` | Serialises todos into a versioned envelope and writes to `localStorage`. |
| `clearTodos` | `() => void` | Removes the todos key from `localStorage`. |

### `src/hooks/useLocalStorage.ts`

| Name | Signature | Description |
|---|---|---|
| `useLocalStorage` | `<T>(key: string, initialValue: T) => [T, Dispatch<SetStateAction<T>>]` | Generic hook that synchronises React state with a `localStorage` key. |

### `src/hooks/useTodos.ts`

| Name | Signature | Description |
|---|---|---|
| `useTodos` | `() => UseTodosReturn` | Central hook. Loads persisted todos on mount, exposes all CRUD actions, and returns filtered/sorted `visibleTodos` and `stats`. |

---

## Behavior Contracts

### Validation Rules

#### Title (`validateTitle`)

1. The raw input is **trimmed** before any length check.
2. After trimming, the length must satisfy `TITLE_MIN_LENGTH ≤ length ≤ TITLE_MAX_LENGTH` (i.e. 1–80 characters inclusive).
3. A string of only whitespace trims to `""` and is **rejected** (step 2 catches it).
4. On failure the returned `error` is a human-readable sentence suitable for direct display in the UI.
5. On success the returned `value` is the **trimmed** string (not the raw input).

#### Due date (`isValidDateString`)

1. Must match `/^\d{4}-\d{2}-\d{2}$/`.
2. Must parse to a valid calendar date (e.g. `2025-02-30` is rejected).

---

### Sorting Rules and Tie-Breakers

Controlled by the `SortMode` type and implemented in `compareTodos` inside `useTodos.ts`.

#### `"created"` — Created date (newest first)

- Primary key: `createdAt` descending (lexicographic, valid because ISO strings are zero-padded).
- No tie-breaker needed (`createdAt` is unique per todo within a session).

#### `"dueDate"` — Due date (soonest first)

- Primary key: `dueDate` ascending; todos **without** a `dueDate` are placed **last**.
- Tie-breaker 1: `priority` descending (`high > medium > low`).
- Tie-breaker 2: `createdAt` descending (newest first).

#### `"priority"` — Priority (high → low)

- Primary key: `priority` descending (`high > medium > low`).
- Tie-breaker: `createdAt` descending (newest first).

**Priority numeric ranking (internal):**

| Value | Rank |
|---|---|
| `"low"` | 0 |
| `"medium"` | 1 |
| `"high"` | 2 |

---

### Storage Behavior and Schema Versioning

Implemented in `src/services/todosStorage.ts`.

#### Key

All todo data is stored under the single `localStorage` key:

```
todo-list-app:todos
```

#### Envelope format (version 1 — current)

```json
{
  "version": 1,
  "savedAt": "2025-01-15T12:34:56.789Z",
  "todos": [ /* Todo[] */ ]
}
```

#### Load behavior

1. If the key is absent → returns `[]`.
2. If the JSON is malformed → swallows the error, logs to console, returns `[]`.
3. If `envelope.version !== 1` → logs a warning, returns `[]` (does not overwrite the stored data).
4. Otherwise → returns `envelope.todos` (may be `[]` if the list is empty).

#### Save behavior

1. Creates a new envelope with `version: 1`, `savedAt: new Date().toISOString()`, and the provided `todos` array.
2. Calls `localStorage.setItem` to overwrite any existing value.
3. Storage errors (e.g. quota exceeded) are swallowed and logged.

#### Schema migration

When `version` is bumped in the future:
- `loadTodos` must be updated to handle the old version, transform the data, and return a valid `Todo[]`.
- The README and JSDoc for `TodosStorageEnvelope` must be updated to document the new version and the migration path.

---

## DocRot Test Ideas

The following intentional code changes should each cause detectable documentation drift between the README, JSDoc, and the implementation:

1. **Change the priority enum** — add `"critical"` as a fourth priority level. The README table, `Priority` type JSDoc, `PRIORITY_RANK` map, sort rules, and priority badge UI all reference the three-value enum.

2. **Make `dueDate` required** — remove the `?` from `Todo.dueDate`. The README "Data Model" table, the field's JSDoc, `CreateTodoInput`, and the "undated last" sort documentation all describe it as optional.

3. **Change the default priority** — change the `addTodo` default from `"medium"` to `"low"`. The README, `CreateTodoInput` JSDoc, `TodoForm` component, and the test for "defaults priority to medium" would all drift.

4. **Rename `createdAt` → `addedAt`** — cascades through the type, all JSDoc, sorting documentation, README data model table, and several component props.

5. **Change the `title` max length** — e.g. from 80 to 120 chars. `TITLE_MAX_LENGTH`, `validateTitle` JSDoc, README validation rules, and the `maxLength` HTML attribute on the input all document 80.

6. **Change the storage key** — e.g. from `todo-list-app:todos` to `todos-v2`. The README storage section and `todosStorage.ts` JSDoc both document the key name explicitly.

7. **Bump the envelope version to 2** — change `version: 1` to `version: 2` in `saveTodos` without updating the type or README. The `TodosStorageEnvelope` type, its JSDoc, and the README schema section all say version 1.

8. **Change the `"dueDate"` sort tie-breaker order** — swap priority and `createdAt` as tie-breakers. The README Sorting section and the `compareTodos` JSDoc block both document the current order.

9. **Remove the `stats` return value from `useTodos`** — the README Function Documentation Index, the `UseTodosReturn` interface JSDoc, and the `TodoApp` component all reference `stats`.

10. **Change `"created"` sort from newest-first to oldest-first** — the `SortMode` JSDoc in `todo.ts`, the `compareTodos` JSDoc in `useTodos.ts`, and the README all say "newest first".

11. **Add a `tags` field to `Todo`** — the README Data Model table, the `Todo` interface JSDoc, and the storage envelope documentation would all need updating.

12. **Change the `clearTodos` behavior** to not remove the key but instead write an empty envelope** — the README contract says "`loadTodos()` will return `[]`" and "removes the key", both of which would be false.
