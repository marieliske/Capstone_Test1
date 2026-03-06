/** Maximum allowed length (in characters) for a todo title. */
export const TITLE_MAX_LENGTH = 80;

/** Minimum allowed length (in characters) for a todo title after trimming. */
export const TITLE_MIN_LENGTH = 1;

/**
 * Validates and normalises a todo title string.
 *
 * Validation rules:
 * 1. The value is trimmed before any length check.
 * 2. After trimming, the length must be between `TITLE_MIN_LENGTH` (1) and
 *    `TITLE_MAX_LENGTH` (80) inclusive.
 * 3. A string of only whitespace characters is rejected (it trims to "").
 *
 * Contract:
 * - Does not mutate the input.
 * - Returns `{ valid: true, value: trimmedTitle }` on success.
 * - Returns `{ valid: false, error: string }` on failure; `error` is a
 *   human-readable message suitable for display in the UI.
 *
 * @param raw - The raw title string provided by the user.
 * @returns A discriminated union indicating success or failure.
 */
export function validateTitle(
  raw: string,
): { valid: true; value: string } | { valid: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length < TITLE_MIN_LENGTH) {
    return { valid: false, error: 'Title must not be empty.' };
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Title must be ${TITLE_MAX_LENGTH} characters or fewer (currently ${trimmed.length}).`,
    };
  }
  return { valid: true, value: trimmed };
}

/**
 * Returns `true` when a string is a valid YYYY-MM-DD date.
 *
 * Contract:
 * - Does not mutate any external state.
 * - An empty string or `undefined` returns `false`.
 * - Only validates format and calendar validity (e.g. 2025-02-30 → false).
 *
 * @param value - The string to check.
 * @returns `true` if the string is a valid YYYY-MM-DD calendar date.
 */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}
