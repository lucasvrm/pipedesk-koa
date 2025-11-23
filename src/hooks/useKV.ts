import { useState, useCallback } from 'react';

/**
 * Replacement hook for @github/spark/hooks useKV
 * This provides a simple key-value state management that was previously
 * provided by @github/spark/hooks
 * 
 * @deprecated MIGRATION REQUIRED BY Q1 2026
 * This is a temporary compatibility shim to support existing code.
 * 
 * **How to migrate:**
 * 1. For notifications: Use `useNotifications()` from '@/services/notificationService'
 * 2. For deals: Use `useDeals()` from '@/services/dealService'
 * 3. For stages: Use `useStages()` from '@/services/pipelineService'
 * 4. For other entities: Create appropriate service in @/services with React Query hooks
 * 
 * **Why migrate:**
 * - Better performance with caching
 * - Real-time updates from Supabase
 * - Type safety with TypeScript
 * - Centralized error handling
 * - Automatic refetching and invalidation
 * 
 * New code should NEVER use this hook - always use service layer hooks.
 */
export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Use localStorage as backing store with the key
  const getStoredValue = useCallback((): T => {
    try {
      const item = localStorage.getItem(`kv:${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  }, [key, defaultValue]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for functional updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        
        // Save to localStorage
        localStorage.setItem(`kv:${key}`, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
