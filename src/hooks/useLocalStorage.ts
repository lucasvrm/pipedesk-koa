import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for persisting state in localStorage with automatic JSON serialization.
 * 
 * @param key - The localStorage key
 * @param initialValue - The initial value to use if no stored value exists
 * @returns A tuple of [storedValue, setValue] similar to useState
 * 
 * @example
 * ```tsx
 * const [collapsed, setCollapsed] = useLocalStorage('my-key', { section1: false })
 * ```
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use the provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  // Persist to localStorage whenever the value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // Ignore storage errors (quota exceeded, private mode, etc.)
    }
  }, [key, storedValue])

  // Wrapper to support functional updates like setState
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
      return nextValue
    })
  }, [])

  return [storedValue, setValue]
}
