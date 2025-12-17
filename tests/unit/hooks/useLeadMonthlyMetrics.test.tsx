import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLeadMonthlyMetrics } from '@/hooks/useLeadMonthlyMetrics'
import { supabase } from '@/lib/supabaseClient'
import React from 'react'

// Mock supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'test-user-123' }
  })
}))

describe('useLeadMonthlyMetrics', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const createMockQuery = (count: number | null, error: any = null) => ({
    count,
    error,
    data: null
  })

  it('should fetch created and qualified counts for current month', async () => {
    const mockFrom = vi.fn()
    const mockSelect = vi.fn()
    const mockIs = vi.fn()
    const mockGte = vi.fn()
    const mockLt = vi.fn()

    // Chain for created count
    const createdChain = {
      select: vi.fn(() => createdChain),
      is: vi.fn(() => createdChain),
      gte: vi.fn(() => createdChain),
      lt: vi.fn().mockResolvedValue(createMockQuery(15))
    }

    // Chain for qualified count
    const qualifiedChain = {
      select: vi.fn(() => qualifiedChain),
      is: vi.fn(() => qualifiedChain),
      gte: vi.fn(() => qualifiedChain),
      lt: vi.fn().mockResolvedValue(createMockQuery(8))
    }

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      // First call is for created count, second for qualified
      if (callCount === 1) return createdChain
      return qualifiedChain
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const { result } = renderHook(() => useLeadMonthlyMetrics(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      createdThisMonth: 15,
      qualifiedThisMonth: 8
    })
  })

  it('should return 0 when counts are null', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue(createMockQuery(null))
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const { result } = renderHook(() => useLeadMonthlyMetrics(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      createdThisMonth: 0,
      qualifiedThisMonth: 0
    })
  })

  it('should not fetch when disabled', async () => {
    const mockFrom = vi.fn()
    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const { result } = renderHook(
      () => useLeadMonthlyMetrics({ enabled: false }),
      { wrapper }
    )

    // Wait a bit to ensure query would have run if enabled
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockFrom).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
  })

  it('should apply owner filter when owner is "me"', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue(createMockQuery(5))
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const { result } = renderHook(
      () => useLeadMonthlyMetrics({ filters: { owner: 'me' } }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockChain.eq).toHaveBeenCalledWith('owner_user_id', 'test-user-123')
  })

  it('should apply ownerIds filter when provided', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue(createMockQuery(10))
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const { result } = renderHook(
      () => useLeadMonthlyMetrics({ filters: { ownerIds: ['user-1', 'user-2'] } }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockChain.in).toHaveBeenCalledWith('owner_user_id', ['user-1', 'user-2'])
  })

  it('should apply origin filter when provided', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue(createMockQuery(12))
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const { result } = renderHook(
      () => useLeadMonthlyMetrics({ filters: { origin: ['origin-1'] } }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockChain.in).toHaveBeenCalledWith('lead_origin_id', ['origin-1'])
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error')
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ count: null, error: mockError })
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain as any)

    const { result } = renderHook(() => useLeadMonthlyMetrics(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBe(mockError)
  })
})
