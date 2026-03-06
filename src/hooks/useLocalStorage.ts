import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook that synchronises a piece of React state with `localStorage`.
 *
 * The value is serialised with `JSON.stringify` and deserialised with
 * `JSON.parse`. On mount the stored value (if any) is used as the initial
 * state; subsequent calls to the returned setter both update React state and
 * persist the new value to `localStorage`.
 *
 * Contract:
 * - Does not mutate the stored value directly; always goes through the setter.
 * - If the stored JSON cannot be parsed, falls back to `initialValue` and logs
 *   a console warning.
 * - The `key` parameter must be stable across renders (treat it like a `useRef`
 *   value — do not change it after mount).
 *
 * @template T - Type of the persisted value.
 * @param key          - The `localStorage` key to read/write.
 * @param initialValue - Value to use when the key is absent or unreadable.
 * @returns A `[value, setValue]` tuple, identical in shape to `useState`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      console.warn(`[useLocalStorage] Could not parse stored value for key "${key}".`);
      return initialValue;
    }
  });

  // Sync to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.error(`[useLocalStorage] Could not persist value for key "${key}":`, err);
    }
  }, [key, state]);

  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => {
      setState(action);
    },
    [],
  );

  return [state, setValue];
}
