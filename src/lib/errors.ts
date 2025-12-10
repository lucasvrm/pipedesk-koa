/**
 * Custom error class for API request failures.
 * Provides structured error information including HTTP status and URL.
 */
export class ApiError extends Error {
  public readonly status: number
  public readonly url: string

  constructor(message: string, status: number, url: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}
