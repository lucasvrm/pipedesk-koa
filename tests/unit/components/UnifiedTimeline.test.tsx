import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnifiedTimeline } from '@/components/UnifiedTimeline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as any

// Mock the hooks
vi.mock('@/hooks/useUnifiedTimeline', () => ({
  useUnifiedTimeline: vi.fn()
}))

vi.mock('@/services/commentService', () => ({
  useCreateComment: vi.fn()
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user-123', name: 'Test User' }
  }))
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

import { useUnifiedTimeline } from '@/hooks/useUnifiedTimeline'
import { useCreateComment } from '@/services/commentService'

describe('UnifiedTimeline', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('should render loading state with skeletons', () => {
    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items: [],
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    const { container } = render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    // Should have skeleton elements
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(3) // Should have multiple skeletons for loading state
  })

  it('should render empty state when no items exist', () => {
    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items: [],
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    expect(screen.getByText('Nenhum histórico recente')).toBeInTheDocument()
  })

  it('should render error state with retry button', async () => {
    const refetchMock = vi.fn() as unknown as () => Promise<void>
    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items: [],
      data: [],
      isLoading: false,
      error: new Error('Test error'),
      refetch: refetchMock
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    expect(screen.getByText('Erro ao carregar atividades')).toBeInTheDocument()
    
    const retryButton = screen.getByText('Tentar novamente')
    await userEvent.click(retryButton)
    
    expect(refetchMock).toHaveBeenCalled()
  })

  it('should group items by date with proper headers', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const items = [
      {
        id: '1',
        type: 'comment' as const,
        date: today.toISOString(),
        author: { name: 'User 1', avatar: '' },
        content: 'Comment today'
      },
      {
        id: '2',
        type: 'system' as const,
        date: yesterday.toISOString(),
        author: { name: 'System', avatar: '' },
        content: 'Activity yesterday'
      },
      {
        id: '3',
        type: 'system' as const,
        date: weekAgo.toISOString(),
        author: { name: 'System', avatar: '' },
        content: 'Activity last week'
      }
    ]

    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items,
      data: items,
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    // Check for date headers
    expect(screen.getByText('Hoje')).toBeInTheDocument()
    expect(screen.getByText('Ontem')).toBeInTheDocument()
    
    // Check for activity content
    expect(screen.getByText('Comment today')).toBeInTheDocument()
    expect(screen.getByText('Activity yesterday')).toBeInTheDocument()
    expect(screen.getByText('Activity last week')).toBeInTheDocument()
  })

  it('should display filter buttons and allow filtering', async () => {
    const items = [
      {
        id: '1',
        type: 'comment' as const,
        date: new Date().toISOString(),
        author: { name: 'User 1', avatar: '' },
        content: 'This is a comment'
      },
      {
        id: '2',
        type: 'system' as const,
        date: new Date().toISOString(),
        author: { name: 'System', avatar: '' },
        content: 'This is a system event'
      }
    ]

    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items,
      data: items,
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    // Should show all items initially
    expect(screen.getByText('This is a comment')).toBeInTheDocument()
    expect(screen.getByText('This is a system event')).toBeInTheDocument()

    // Click on "Comentários" filter
    const commentFilter = screen.getByRole('button', { name: /Comentários/i })
    await userEvent.click(commentFilter)

    // Should only show comment
    expect(screen.getByText('This is a comment')).toBeInTheDocument()
    expect(screen.queryByText('This is a system event')).not.toBeInTheDocument()

    // Click on "Sistema" filter
    const systemFilter = screen.getByRole('button', { name: /Sistema/i })
    await userEvent.click(systemFilter)

    // Should only show system event
    expect(screen.queryByText('This is a comment')).not.toBeInTheDocument()
    expect(screen.getByText('This is a system event')).toBeInTheDocument()
  })

  it('should highlight important activities', () => {
    const items = [
      {
        id: '1',
        type: 'system' as const,
        date: new Date().toISOString(),
        author: { name: 'Sistema', avatar: '' },
        content: 'Lead qualificou para negócio'
      }
    ]

    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items,
      data: items,
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    const { container } = render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    // Check content is rendered
    expect(screen.getByText('Lead qualificou para negócio')).toBeInTheDocument()
    
    // Important activity should have ring classes (visual indicator)
    const importantBadges = container.querySelectorAll('.ring-amber-400')
    expect(importantBadges.length).toBeGreaterThan(0)
  })

  it('should show author avatars and names', () => {
    const items = [
      {
        id: '1',
        type: 'comment' as const,
        date: new Date().toISOString(),
        author: { name: 'John Doe', avatar: 'http://example.com/avatar.jpg' },
        content: 'Test comment'
      }
    ]

    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items,
      data: items,
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should truncate long text and show "ver mais" button', async () => {
    const longText = 'A'.repeat(300)
    const items = [
      {
        id: '1',
        type: 'comment' as const,
        date: new Date().toISOString(),
        author: { name: 'User', avatar: '' },
        content: longText
      }
    ]

    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items,
      data: items,
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    // Should show truncated text
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument()
    
    // Should have "ver mais" button
    const verMaisButton = screen.getByText('ver mais')
    expect(verMaisButton).toBeInTheDocument()

    // Click should expand
    await userEvent.click(verMaisButton)
    
    // Should now show "ver menos"
    expect(screen.getByText('ver menos')).toBeInTheDocument()
  })

  it('should allow comment submission with Ctrl+Enter', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({})
    
    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items: [],
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    
    await userEvent.type(textarea, 'New comment')
    await userEvent.keyboard('{Control>}{Enter}{/Control}')

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        entityId: 'test-123',
        entityType: 'lead',
        content: 'New comment',
        authorId: 'user-123',
        mentions: []
      })
    })
  })

  it('should disable comment submission when submitting', async () => {
    const mockMutateAsync = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    vi.mocked(useUnifiedTimeline).mockReturnValue({
      items: [],
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn() as unknown as () => Promise<void>
    })

    vi.mocked(useCreateComment).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false
    } as any)

    render(
      <UnifiedTimeline entityId="test-123" entityType="lead" />,
      { wrapper }
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    const submitButton = screen.getByRole('button', { name: '' })

    await userEvent.type(textarea, 'New comment')
    await userEvent.click(submitButton)

    // Button should be disabled while submitting
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })
})
