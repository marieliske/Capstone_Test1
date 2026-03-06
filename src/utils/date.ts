/**
 * Returns the current date and time as an ISO-8601 string.
 *
 * Contract:
 * - Does not mutate any external state.
 * - Equivalent to `new Date().toISOString()`.
 *
 * @returns An ISO-8601 timestamp string, e.g. `"2025-01-15T12:34:56.789Z"`.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Formats an ISO-8601 timestamp into a human-readable short date string.
 *
 * Contract:
 * - Does not mutate any external state.
 * - Returns `"Invalid date"` when given an unparseable string.
 * - Uses the user's local timezone for display.
 *
 * @param iso - An ISO-8601 date or datetime string.
 * @returns A locale-formatted date string, e.g. `"Jan 15, 2025"`.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Compares two optional ISO date strings for sorting purposes (ascending).
 *
 * Todos without a due date (`undefined`) are sorted **after** todos that have one,
 * regardless of other factors.
 *
 * Contract:
 * - Does not mutate inputs.
 * - Returns a negative number if `a` comes before `b`.
 * - Returns a positive number if `a` comes after `b`.
 * - Returns `0` if both are equal or both are `undefined`.
 * - `undefined` values always sort last.
 *
 * @param a - First optional ISO date string.
 * @param b - Second optional ISO date string.
 * @returns A numeric comparator value suitable for `Array.prototype.sort`.
 */
export function compareDates(a: string | undefined, b: string | undefined): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;  // a goes last
  if (b === undefined) return -1; // b goes last
  return a.localeCompare(b);
}

/**
 * Returns `true` when the given ISO date string represents a past date
 * (strictly before today in local time).
 *
 * Contract:
 * - Does not mutate any external state.
 * - Comparison is date-only (ignores time).
 * - Returns `false` for `undefined` or invalid strings.
 *
 * @param iso - An optional ISO date string (YYYY-MM-DD or datetime).
 * @returns `true` if the date is in the past, `false` otherwise.
 */
export function isOverdue(iso: string | undefined): boolean {
  if (!iso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  if (isNaN(due.getTime())) return false;
  due.setHours(0, 0, 0, 0);
  return due < today;
}
