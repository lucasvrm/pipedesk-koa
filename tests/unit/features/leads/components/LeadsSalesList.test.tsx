import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LeadsSalesList } from '@/features/leads/components/LeadsSalesList'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'

// Mock the SystemMetadata context
vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    getLeadStatusById: () => null,
    leadStatuses: []
  })
}))

// Mock the updateLead hook and useLead
vi.mock('@/services/leadService', () => ({
  useUpdateLead: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  }),
  useLead: () => ({
    data: undefined,
    isLoading: false
  }),
  useLeadContacts: () => ({
    addContact: { mutateAsync: vi.fn(), isPending: false },
    removeContact: { mutateAsync: vi.fn(), isPending: false }
  })
}))

// Mock the tagService hooks
vi.mock('@/services/tagService', () => ({
  useTags: () => ({ data: [], isLoading: false }),
  useEntityTags: () => ({ data: [], isLoading: false }),
  useTagOperations: () => ({
    assign: { mutateAsync: vi.fn(), isPending: false },
    unassign: { mutateAsync: vi.fn(), isPending: false }
  }),
  createTag: vi.fn().mockResolvedValue({ id: 'new-tag', name: 'New Tag', color: '#000000' })
}))

// Mock the userService hooks
vi.mock('@/services/userService', () => ({
  useUsers: () => ({ data: [], isLoading: false })
}))

// Mock contactService
vi.mock('@/services/contactService', () => ({
  useContacts: () => ({ data: [], isLoading: false })
}))

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

describe('LeadsSalesList', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const baseProps = {
    isLoading: false,
    orderBy: 'priority' as const,
    selectedIds: [],
    onSelectAll: vi.fn(),
    onSelectOne: vi.fn(),
    onNavigate: vi.fn()
  }

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {ui}
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error state when leads have no identifiers', () => {
    const leads: LeadSalesViewItem[] = [
      {
        priorityBucket: 'hot',
        legalName: 'Lead sem ID'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    expect(screen.getByText('Não foi possível exibir os leads')).toBeInTheDocument()
    expect(screen.getByText(/dados retornados estão incompletos/i)).toBeInTheDocument()
    expect(console.warn).toHaveBeenCalled()
  })

  it('renders safely when lead has malformed user-facing data', () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'malformed',
        priorityBucket: 'warm',
        legalName: 'Lead com dados inválidos',
        nextAction: {
          code: 'call',
          // @ts-expect-error testing resilience to malformed API payloads
          label: { text: 'Invalid label' },
          // @ts-expect-error testing resilience to malformed API payloads
          reason: { message: 'Invalid reason' }
        },
        tags: [
          // @ts-expect-error testing resilience to malformed API payloads
          { id: 'tag-1', name: { nested: true }, color: { invalid: true } },
          { id: 'tag-2', name: 'Válida', color: '#ff0000' }
        ]
      }
    ]

    expect(() => renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)).not.toThrow()

    expect(screen.getByText('Tag')).toBeInTheDocument()
    expect(screen.getByText('Válida')).toBeInTheDocument()
    expect(screen.getByText('Sem próxima ação')).toBeInTheDocument()
  })

  it('handles missing next action label and invalid tag name without crashing', () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'incomplete-data',
        priorityBucket: 'warm',
        legalName: 'Lead com payload incompleto',
        nextAction: {
          code: 'email',
          reason: 'Seguir com follow-up'
        },
        tags: [
          {
            // @ts-expect-error simulating malformed payload
            name: { text: 'Objeto inválido' },
            color: '#00ff00'
          }
        ]
      }
    ]

    expect(() => renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)).not.toThrow()

    expect(screen.getByText('Sem próxima ação')).toBeInTheDocument()
    expect(screen.getByText('Tag')).toBeInTheDocument()
  })

  it('logs the lead data when row rendering fails in preview builds', () => {
    const originalEnv = { ...import.meta.env }
    ;(import.meta as any).env.VITE_VERCEL_ENV = 'preview'

    const failingLead: LeadSalesViewItem = {
      id: 'lead-123',
      priorityBucket: 'hot',
      legalName: 'Lead que quebra render'
    }

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      renderWithProviders(
        <LeadsSalesList
          {...baseProps}
          leads={[failingLead]}
          getLeadActions={() => {
            throw new Error('Render failure')
          }}
        />
      )
    ).toThrow()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('LeadSalesRow render failed'),
      'lead-123',
      failingLead,
      expect.any(Error)
    )

    Object.assign(import.meta.env, originalEnv)
  })

  it('renders mirror scrollbar when horizontal overflow exists', async () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'scroll-lead',
        priorityBucket: 'hot',
        legalName: 'Lead com overflow horizontal'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 1200, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('leads-sales-scrollbar-mirror')).toBeInTheDocument()
    })
  })

  it('positions mirror scrollbar outside the main scroll container', async () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'scroll-structure',
        priorityBucket: 'hot',
        legalName: 'Lead com overflow horizontal'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 600, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 1200, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    const mirrorScrollbar = await screen.findByTestId('leads-sales-scrollbar-mirror')
    expect(scrollContainer.querySelector('[data-testid="leads-sales-scrollbar-mirror"]')).toBeNull()
    expect(scrollContainer.contains(mirrorScrollbar)).toBe(false)
  })

  it('hides mirror scrollbar when content fits horizontally', async () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'no-overflow',
        priorityBucket: 'warm',
        legalName: 'Lead sem overflow'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 900, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 800, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(screen.queryByTestId('leads-sales-scrollbar-mirror')).not.toBeInTheDocument()
    })
  })

  it('keeps mirror scrollbar in sync with table scroll positions', async () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'sync-scroll',
        priorityBucket: 'hot',
        legalName: 'Lead com sincronização'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 500, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 1000, configurable: true })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    const mirrorWrapper = await screen.findByTestId('leads-sales-scrollbar-mirror')
    const mirrorScroll = mirrorWrapper.querySelector('div') as HTMLDivElement

    act(() => {
      scrollContainer.scrollLeft = 120
      scrollContainer.dispatchEvent(new Event('scroll'))
    })

    expect(mirrorScroll.scrollLeft).toBe(scrollContainer.scrollLeft)

    act(() => {
      mirrorScroll.scrollLeft = 260
      mirrorScroll.dispatchEvent(new Event('scroll'))
    })

    expect(scrollContainer.scrollLeft).toBe(mirrorScroll.scrollLeft)
  })
})
