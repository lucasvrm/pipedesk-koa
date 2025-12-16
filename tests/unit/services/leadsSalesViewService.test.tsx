import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLeadsSalesView, LeadSalesViewQuery } from '@/services/leadsSalesViewService'
import { ApiError } from '@/lib/errors'
import React from 'react'

// Valid orderBy values from the API
type ValidOrderBy = NonNullable<LeadSalesViewQuery['orderBy']>

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('leadsSalesViewService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Success scenarios', () => {
    it('should return data and pagination on successful response', async () => {
      const mockData = {
        data: [
          {
            id: 'lead-1',
            legalName: 'Test Company',
            priorityBucket: 'hot' as const,
            priorityScore: 95,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          perPage: 10,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockData)
      expect(result.current.data?.data).toHaveLength(1)
      expect(result.current.data?.pagination.total).toBe(1)
    })

    it('should handle alternative response structure with items and count', async () => {
      const mockData = {
        items: [
          {
            id: 'lead-1',
            legalName: 'Test Company',
          },
        ],
        count: 1,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toEqual(mockData.items)
      expect(result.current.data?.pagination.total).toBe(1)
    })
  })

  describe('Error scenarios with error codes', () => {
    it('should parse validation_error code from backend response', async () => {
      const errorResponse = {
        error: 'Alguns filtros da Sales View são inválidos',
        code: 'validation_error',
        details: {
          invalidFields: ['priority', 'status'],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        url: '/api/leads/sales-view',
        json: async () => errorResponse,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(ApiError)
      const apiError = result.current.error as ApiError
      expect(apiError.code).toBe('validation_error')
      expect(apiError.message).toBe('Alguns filtros da Sales View são inválidos')
      expect(apiError.details).toEqual({ invalidFields: ['priority', 'status'] })
      expect(apiError.status).toBe(400)
    })

    it('should parse sales_view_error code from backend response', async () => {
      const errorResponse = {
        error: 'Erro interno ao processar Sales View',
        code: 'sales_view_error',
        details: {
          internalMessage: 'Database connection failed',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        url: '/api/leads/sales-view',
        json: async () => errorResponse,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(ApiError)
      const apiError = result.current.error as ApiError
      expect(apiError.code).toBe('sales_view_error')
      expect(apiError.message).toBe('Erro interno ao processar Sales View')
      expect(apiError.details).toEqual({ internalMessage: 'Database connection failed' })
      expect(apiError.status).toBe(500)
    })

    it('should handle error response without code field (fallback)', async () => {
      const errorResponse = {
        message: 'Generic error message',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        url: '/api/leads/sales-view',
        json: async () => errorResponse,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(ApiError)
      const apiError = result.current.error as ApiError
      expect(apiError.code).toBeUndefined()
      expect(apiError.details).toBeUndefined()
      expect(apiError.message).toBe('Generic error message')
      expect(apiError.status).toBe(500)
    })

    it('should handle error response with only error field', async () => {
      const errorResponse = {
        error: 'Something went wrong',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        url: '/api/leads/sales-view',
        json: async () => errorResponse,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(ApiError)
      const apiError = result.current.error as ApiError
      expect(apiError.code).toBeUndefined()
      expect(apiError.message).toBe('Something went wrong')
    })

    it('should use fallback message when no error or message field exists', async () => {
      const errorResponse = {}

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        url: '/api/leads/sales-view',
        json: async () => errorResponse,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(ApiError)
      const apiError = result.current.error as ApiError
      expect(apiError.message).toBe('Não foi possível carregar a visão de vendas')
    })
  })

  describe('Non-JSON error responses', () => {
    it('should handle HTML error responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/html' }),
        url: '/api/leads/sales-view',
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeInstanceOf(ApiError)
      const apiError = result.current.error as ApiError
      expect(apiError.code).toBeUndefined()
      expect(apiError.message).toBe('Não foi possível carregar a visão de vendas')
      expect(apiError.status).toBe(500)
    })
  })

  describe('Filter parameters', () => {
    it('should pass filter parameters correctly', async () => {
      const mockData = {
        data: [],
        pagination: { total: 0, page: 1, perPage: 10 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      renderHook(
        () =>
          useLeadsSalesView({
            page: 2,
            pageSize: 20,
            owner: 'me',
            ownerIds: ['user-1', 'user-2'],
            priority: ['hot', 'warm'],
            status: ['new', 'contacted'],
            origin: ['referral'],
            daysWithoutInteraction: 7,
            orderBy: 'last_interaction',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('page=2')
      expect(callUrl).toContain('pageSize=20')
      expect(callUrl).toContain('owner=me')
      expect(callUrl).toMatch(/ownerIds=user-1[,%]2[Cc]user-2/)
      // Note: URLSearchParams encodes commas as %2C
      expect(callUrl).toMatch(/priority=hot[,%]2[Cc]warm/)
      expect(callUrl).toMatch(/status=new[,%]2[Cc]contacted/)
      expect(callUrl).toContain('origin=referral')
      expect(callUrl).toContain('days_without_interaction=7')
      expect(callUrl).toContain('order_by=last_interaction')
    })

    it('should pass order_by=status parameter correctly', async () => {
      const mockData = {
        data: [],
        pagination: { total: 0, page: 1, perPage: 10 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      renderHook(
        () =>
          useLeadsSalesView({
            page: 1,
            pageSize: 10,
            orderBy: 'status',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('order_by=status')
    })

    it('should pass all orderBy options correctly', async () => {
      const mockData = {
        data: [],
        pagination: { total: 0, page: 1, perPage: 10 },
      }

      const orderByValues: ValidOrderBy[] = ['priority', 'last_interaction', 'created_at', 'status', 'next_action', 'owner']

      for (const orderBy of orderByValues) {
        // Clear mock before each iteration to track calls explicitly
        mockFetch.mockClear()
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockData,
        })

        const { unmount } = renderHook(
          () =>
            useLeadsSalesView({
              page: 1,
              pageSize: 10,
              orderBy,
            }),
          { wrapper: createWrapper() }
        )

        await waitFor(() => expect(mockFetch).toHaveBeenCalled())

        // After clearing, the first call is the one we want
        const callUrl = mockFetch.mock.calls[0][0]
        expect(callUrl).toContain(`order_by=${orderBy}`)

        unmount()
      }
    })
  })

  describe('Qualified lead filtering (backend-first approach)', () => {
    it('should return backend data as-is without client-side filtering', async () => {
      // Backend is now responsible for filtering - FE should not filter
      const mockData = {
        data: [
          {
            id: 'lead-1',
            legalName: 'Active Lead',
            qualifiedAt: null,
            deletedAt: null,
          },
          {
            id: 'lead-2',
            legalName: 'Another Lead',
            qualifiedAt: null,
            deletedAt: null,
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          perPage: 10,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Data should match exactly what backend returned
      expect(result.current.data?.data).toHaveLength(2)
      expect(result.current.data?.pagination.total).toBe(2)
    })

    it('should NOT filter out leads with qualifiedAt - backend handles this', async () => {
      // Backend should filter, but if it returns qualified leads, FE should not filter them
      const mockData = {
        data: [
          {
            id: 'lead-1',
            legalName: 'Active Lead',
            qualifiedAt: null,
            deletedAt: null,
          },
          {
            id: 'lead-2',
            legalName: 'Qualified Lead',
            qualifiedAt: '2024-01-15T10:00:00Z',
            deletedAt: null,
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          perPage: 10,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // FE should NOT filter - data should match exactly what backend returned
      expect(result.current.data?.data).toHaveLength(2)
      expect(result.current.data?.pagination.total).toBe(2)
    })

    it('should pass includeQualified=true to backend when option is set', async () => {
      const mockData = {
        data: [
          {
            id: 'lead-1',
            legalName: 'Active Lead',
          },
          {
            id: 'lead-2',
            legalName: 'Qualified Lead',
            qualifiedAt: '2024-01-15T10:00:00Z',
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          perPage: 10,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }, { includeQualified: true }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Verify the URL contains includeQualified=true
      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('includeQualified=true')

      // All leads should be returned
      expect(result.current.data?.data).toHaveLength(2)
      expect(result.current.data?.pagination.total).toBe(2)
    })

    it('should NOT pass includeQualified param when option is false/undefined', async () => {
      const mockData = {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          perPage: 10,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      // Verify the URL does NOT contain includeQualified
      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).not.toContain('includeQualified')
    })

    it('should return empty array when backend returns empty', async () => {
      const mockData = {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          perPage: 10,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      })

      const { result } = renderHook(
        () => useLeadsSalesView({ page: 1, pageSize: 10 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toHaveLength(0)
      expect(result.current.data?.pagination.total).toBe(0)
    })
  })
})
