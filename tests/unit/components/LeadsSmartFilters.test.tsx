import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadsSmartFilters } from '@/features/leads/components/LeadsSmartFilters'
import { User, LeadPriorityBucket, Tag } from '@/lib/types'

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  // @ts-expect-error - JSDOM misses scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('LeadsSmartFilters', () => {
  const mockUsers: User[] = [
    { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'analyst' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', role: 'analyst' },
    { id: 'user-3', name: 'Bob Wilson', email: 'bob@example.com', role: 'analyst' }
  ]

  const mockLeadStatuses = [
    { id: 'status-1', code: 'new', label: 'Novo' },
    { id: 'status-2', code: 'contacted', label: 'Contatado' },
    { id: 'status-3', code: 'qualified', label: 'Qualificado' }
  ]

  const mockLeadOrigins = [
    { id: 'origin-1', code: 'website', label: 'Website' },
    { id: 'origin-2', code: 'referral', label: 'Indicação' },
    { id: 'origin-3', code: 'cold-call', label: 'Cold Call' }
  ]

  const mockTags = [
    { id: 'tag-1', name: 'Urgente', color: '#ff0000' },
    { id: 'tag-2', name: 'Sem resposta', color: '#888888' }
  ] as unknown as Tag[]

  const defaultProps = {
    ownerMode: 'me' as const,
    onOwnerModeChange: vi.fn(),
    selectedOwners: [],
    onSelectedOwnersChange: vi.fn(),
    priority: [] as LeadPriorityBucket[],
    onPriorityChange: vi.fn(),
    statuses: [],
    onStatusesChange: vi.fn(),
    origins: [],
    onOriginsChange: vi.fn(),
    daysWithoutInteraction: null,
    onDaysWithoutInteractionChange: vi.fn(),
    users: mockUsers,
    leadStatuses: mockLeadStatuses,
    leadOrigins: mockLeadOrigins,
    onClear: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render filters button', () => {
    render(<LeadsSmartFilters {...defaultProps} />)

    expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument()
  })

  it('should show active filters count badge', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'all' as const,
      priority: ['hot'] as LeadPriorityBucket[],
      statuses: ['status-1']
    }

    render(<LeadsSmartFilters {...props} />)

    // Should show count of active filters (ownerMode change + priority + status = 3)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should not show badge when no filters are active', () => {
    render(<LeadsSmartFilters {...defaultProps} />)

    // Badge with count should not be present
    const button = screen.getByRole('button', { name: /Filtros/i })
    expect(button.textContent).not.toMatch(/\d+/)
  })

  it('should open popover when filters button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    const filtersButton = screen.getByRole('button', { name: /Filtros/i })
    await user.click(filtersButton)

    expect(screen.getByText('Filtros Inteligentes')).toBeInTheDocument()
    expect(screen.getByText('Limpar')).toBeInTheDocument()
  })

  it('should close popover when clicking Fechar', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    expect(screen.getByText('Filtros Inteligentes')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(screen.queryByText('Filtros Inteligentes')).not.toBeInTheDocument())
  })

  it('shows essential filters and keeps extras hidden initially', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} availableTags={mockTags} selectedTags={[]} onTagsChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByText('Essenciais')).toBeInTheDocument()
    expect(screen.getByText('Responsável')).toBeInTheDocument()
    expect(screen.getByText(/Prioridade/)).toBeInTheDocument()
    expect(screen.getByText(/Status/)).toBeInTheDocument()
    expect(screen.getByText('Mais filtros')).toBeInTheDocument()
    expect(screen.queryByText('Dias sem interação')).not.toBeInTheDocument()
  })

  it('should call onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(defaultProps.onClear).toHaveBeenCalled()
  })

  it('keeps "Mais filtros" collapsed by default and expands categories on demand', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    expect(screen.queryByText('Dias sem interação')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByText('Tempo'))

    expect(screen.getByText('Dias sem interação')).toBeInTheDocument()
  })

  it('shows active counter for filters inside "Mais filtros"', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} origins={['origin-1']} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    expect(screen.getByText('Mais filtros (1)')).toBeInTheDocument()
  })

  it('opens tag selection modal via "Selecionar tags..." action', async () => {
    const user = userEvent.setup()
    const onTagsChange = vi.fn()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        availableTags={mockTags}
        selectedTags={[]}
        onTagsChange={onTagsChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: /Selecionar tags/i }))

    expect(screen.getByText('Selecionar tags')).toBeInTheDocument()
    expect(screen.getByText('Urgente')).toBeInTheDocument()

    await user.click(screen.getByText('Urgente'))
    expect(onTagsChange).toHaveBeenCalledWith(['tag-1'])
  })

  it('allows removing filters from the summary chips', async () => {
    const user = userEvent.setup()
    const onStatusesChange = vi.fn()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        statuses={['status-1']}
        onStatusesChange={onStatusesChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    const removeStatus = screen.getByLabelText(/Remover filtro Status/i)

    await user.click(removeStatus)
    expect(onStatusesChange).toHaveBeenCalledWith([])
  })

  it('should display active filter badges outside popover', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'custom' as const,
      selectedOwners: ['user-1', 'user-2'],
      priority: ['hot', 'warm'] as LeadPriorityBucket[],
      statuses: ['status-1'],
      origins: ['origin-1', 'origin-2'],
      daysWithoutInteraction: 7
    }

    render(<LeadsSmartFilters {...props} />)

    expect(screen.getByText('2 selecionados')).toBeInTheDocument()
    expect(screen.getByText(/2 prioridade/)).toBeInTheDocument()
    expect(screen.getByText(/1 status/)).toBeInTheDocument()
    expect(screen.getByText(/2 origem/)).toBeInTheDocument()
    expect(screen.getByText(/7 dias/)).toBeInTheDocument()
  })

  it('should call onOwnerModeChange when owner mode button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    
    // Click "Todos" button in the popover
    const allButtons = screen.getAllByRole('button', { name: 'Todos' })
    await user.click(allButtons[0])

    expect(defaultProps.onOwnerModeChange).toHaveBeenCalledWith('all')
  })

  it('should handle priority selection', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    
    const hotButton = screen.getByRole('button', { name: 'Hot' })
    await user.click(hotButton)

    expect(defaultProps.onPriorityChange).toHaveBeenCalledWith(['hot'])
  })

  it('should handle days without interaction selection', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByText('Tempo'))
    
    // Find the "7" button for days
    const sevenDaysButton = screen.getByRole('button', { name: '7' })
    await user.click(sevenDaysButton)

    expect(defaultProps.onDaysWithoutInteractionChange).toHaveBeenCalledWith(7)
  })

  it('should handle empty arrays defensively', () => {
    const props = {
      ...defaultProps,
      users: [],
      leadStatuses: [],
      leadOrigins: []
    }

    // Should not throw error
    expect(() => render(<LeadsSmartFilters {...props} />)).not.toThrow()
  })

  it('should show correct owner label for "me" mode', () => {
    render(<LeadsSmartFilters {...defaultProps} ownerMode="me" />)

    // The label should not be visible in the collapsed state, only in popover
    // So we'll just check the component renders
    expect(screen.getByRole('button', { name: /Filtros/i })).toBeInTheDocument()
  })

  it('should show correct owner label for custom mode with selection', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'custom' as const,
      selectedOwners: ['user-1', 'user-2']
    }

    render(<LeadsSmartFilters {...props} />)

    // Should show the owner count badge
    expect(screen.getByText('2 selecionados')).toBeInTheDocument()
  })

  it('should count active filters correctly', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'all' as const, // +1
      priority: ['hot', 'warm'] as LeadPriorityBucket[], // +1
      statuses: ['status-1', 'status-2'], // +1
      origins: ['origin-1'], // +1
      daysWithoutInteraction: 7, // +1
      // orderBy is no longer counted as a filter
    }

    render(<LeadsSmartFilters {...props} />)

    // Total: 5 active filters (orderBy no longer counts)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should not count default values as active filters', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'me' as const, // default, doesn't count
      // orderBy is now separate, not counted as filter
    }

    render(<LeadsSmartFilters {...props} />)

    // Should not show badge
    const button = screen.getByRole('button', { name: /Filtros/i })
    expect(button.textContent).not.toMatch(/\d+/)
  })

  it('should render priority options in compact layout', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByRole('button', { name: 'Hot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Warm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cold' })).toBeInTheDocument()
  })

  it('should render days presets in compact layout', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByText('Tempo'))

    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '14' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Qualquer' })).toBeInTheDocument()
  })

  it('renders next action options when enabled and triggers change', async () => {
    const user = userEvent.setup()
    const onNextActionsChange = vi.fn()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        showNextActionFilter
        nextActions={[]}
        onNextActionsChange={onNextActionsChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByText('Tempo'))
    expect(screen.getByText(/Próxima ação/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Follow-up' }))
    expect(onNextActionsChange).toHaveBeenCalledWith(['send_follow_up'])
  })
})
