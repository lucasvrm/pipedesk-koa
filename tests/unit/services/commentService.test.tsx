import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as commentService from '@/services/commentService'

vi.mock('@/services/notificationService', () => ({
  createNotification: vi.fn()
}))

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {}
}))

describe('useCreateComment', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('invalidates timeline and comments queries on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.spyOn(commentService, 'createComment').mockResolvedValue({
      id: 'comment-1',
      author: { name: 'Tester' }
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => commentService.useCreateComment(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        entityId: 'lead-123',
        entityType: 'lead',
        content: 'hello world',
        authorId: 'user-1',
        mentions: []
      })
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['timeline', 'lead', 'lead-123'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['unifiedTimeline', 'lead-123', 'lead'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['comments', 'lead', 'lead-123'] })
  })
})
