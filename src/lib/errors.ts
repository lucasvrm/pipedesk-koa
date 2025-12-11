/**
 * Custom error class for API request failures.
 * Provides structured error information including HTTP status, URL, error code and details.
 */
export class ApiError extends Error {
  public readonly status: number
  public readonly url: string
  public readonly code?: string
  public readonly details?: any

  constructor(message: string, status: number, url: string, code?: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
    this.code = code
    this.details = details
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}
