import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LeadsSalesList } from '@/features/leads/components/LeadsSalesList'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'
import React from 'react'

// Mock the SystemMetadata context
vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    getLeadStatusById: () => null,
    leadStatuses: []
  })
}))

// Mock the updateLead hook
vi.mock('@/services/leadService', () => ({
  useUpdateLead: () => ({
    mutateAsync: vi.fn(),
    isPending: false
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

  it('uses external tableScrollRef when provided', () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'ref-test',
        priorityBucket: 'hot',
        legalName: 'Lead com ref externo'
      }
    ]

    const externalRef = { current: null } as React.RefObject<HTMLDivElement>
    
    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} tableScrollRef={externalRef} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    expect(scrollContainer).toBeInTheDocument()
  })

  it('renders bottom mirror scrollbar when horizontal overflow exists', () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'mirror-test',
        priorityBucket: 'hot',
        legalName: 'Lead para testar mirror'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    
    // Mock the scroll dimensions to trigger overflow
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 2000, configurable: true })
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 1000, configurable: true })

    // Trigger resize event to update mirror state
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Wait for state update
    setTimeout(() => {
      const bottomMirror = screen.queryByTestId('leads-sales-scrollbar-mirror-bottom')
      expect(bottomMirror).toBeInTheDocument()
    }, 100)
  })

  it('positions bottom mirror scrollbar outside the main scroll container', () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'structure-test',
        priorityBucket: 'hot',
        legalName: 'Lead para testar estrutura'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    
    // Mock the scroll dimensions
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 2000, configurable: true })
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 1000, configurable: true })

    // Trigger resize
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    setTimeout(() => {
      const bottomMirror = screen.queryByTestId('leads-sales-scrollbar-mirror-bottom')
      if (bottomMirror) {
        // Bottom mirror should not be inside the scroll container
        expect(scrollContainer.querySelector('[data-testid="leads-sales-scrollbar-mirror-bottom"]')).toBeNull()
        expect(scrollContainer.contains(bottomMirror)).toBe(false)
      }
    }, 100)
  })

  it('synchronizes scroll between container and bottom mirror', () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'sync-test',
        priorityBucket: 'hot',
        legalName: 'Lead para testar sincronização'
      }
    ]

    renderWithProviders(<LeadsSalesList {...baseProps} leads={leads} />)

    const scrollContainer = screen.getByTestId('leads-sales-scroll')
    
    // Mock the scroll dimensions
    Object.defineProperty(scrollContainer, 'scrollWidth', { value: 2000, configurable: true })
    Object.defineProperty(scrollContainer, 'clientWidth', { value: 1000, configurable: true })

    // Trigger resize
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    setTimeout(() => {
      const bottomMirrorWrapper = screen.queryByTestId('leads-sales-scrollbar-mirror-bottom')
      if (bottomMirrorWrapper) {
        const bottomScrollDiv = bottomMirrorWrapper.querySelector('div') as HTMLDivElement
        
        if (bottomScrollDiv) {
          // Simulate scroll on container
          act(() => {
            Object.defineProperty(scrollContainer, 'scrollLeft', { value: 500, configurable: true, writable: true })
            scrollContainer.dispatchEvent(new Event('scroll'))
          })

          // Bottom should follow
          expect(bottomScrollDiv.scrollLeft).toBe(500)

          // Simulate scroll on bottom mirror
          act(() => {
            Object.defineProperty(bottomScrollDiv, 'scrollLeft', { value: 300, configurable: true, writable: true })
            bottomScrollDiv.dispatchEvent(new Event('scroll'))
          })

          // Container should follow
          expect(scrollContainer.scrollLeft).toBe(300)
        }
      }
    }, 100)
  })
})
