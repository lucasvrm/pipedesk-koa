import { ApiError } from '@/lib/errors'

// Allow a small number of consecutive error-handling runs before suppressing to avoid render loops
export const SALES_VIEW_ERROR_GUARD_LIMIT = 8

export function getSalesErrorKey(error: unknown): string {
  if (!error) return 'unknown-error'
  if (error instanceof ApiError) return error.code || error.message || 'unknown-api-error'
  if (error instanceof Error) return error.message || 'unknown-error'
  try {
    return String(error)
  } catch {
    return 'unknown-error'
  }
}
