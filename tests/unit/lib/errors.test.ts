import { describe, it, expect } from 'vitest'
import { ApiError } from '@/lib/errors'

describe('ApiError', () => {
  it('should create an error with status and url', () => {
    const error = new ApiError('Test error', 500, '/api/test')
    
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Test error')
    expect(error.status).toBe(500)
    expect(error.url).toBe('/api/test')
    expect(error.name).toBe('ApiError')
  })

  it('should have a stack trace', () => {
    const error = new ApiError('Test error', 404, '/api/not-found')
    
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('ApiError')
  })

  it('should work with different status codes', () => {
    const error400 = new ApiError('Bad request', 400, '/api/bad')
    const error401 = new ApiError('Unauthorized', 401, '/api/auth')
    const error500 = new ApiError('Server error', 500, '/api/error')
    
    expect(error400.status).toBe(400)
    expect(error401.status).toBe(401)
    expect(error500.status).toBe(500)
  })

  it('should preserve the error message', () => {
    const message = 'Falha ao carregar leads da Sales View (500)'
    const error = new ApiError(message, 500, '/api/leads/sales-view')
    
    expect(error.message).toBe(message)
    expect(error.toString()).toContain(message)
  })
})
