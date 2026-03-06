/**
 * Generates a RFC-4122 version-4 UUID.
 *
 * Uses `crypto.randomUUID()` when available (all modern browsers and Node ≥ 19)
 * and falls back to a manual implementation for older environments.
 *
 * Contract:
 * - Always returns a string that matches `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`.
 * - Does not mutate any external state.
 * - Each call produces a unique value with overwhelming probability.
 *
 * @returns A UUID v4 string, e.g. `"3d6f4690-3a8e-4b0e-9a4e-1f1e3e4b0e9a"`.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: manual UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
