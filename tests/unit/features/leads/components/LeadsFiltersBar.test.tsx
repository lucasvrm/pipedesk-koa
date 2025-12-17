import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadsFiltersBar, LeadsFiltersChips, NEXT_ACTION_OPTIONS } from '@/features/leads/components/LeadsFiltersBar'
import { AppliedLeadsFilters, FilterActions } from '@/features/leads/hooks/useLeadsFiltersSearchParams'
import { User, Tag } from '@/lib/types'

// Mock ResizeObserver
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

describe('LeadsFiltersBar', () => {
  const mockUsers: User[] = [
    { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'analyst' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', role: 'analyst' },
  ]

  const mockLeadStatuses = [
    { id: 'status-1', code: 'new', label: 'Novo' },
    { id: 'status-2', code: 'contacted', label: 'Contatado' },
  ]

  const mockLeadOrigins = [
    { id: 'origin-1', code: 'website', label: 'Website' },
    { id: 'origin-2', code: 'referral', label: 'Indicação' },
  ]

  const mockTags: Tag[] = [
    { id: 'tag-1', name: 'Urgente', color: '#ff0000' },
    { id: 'tag-2', name: 'Sem resposta', color: '#888888' },
  ] as Tag[]

  const defaultAppliedFilters: AppliedLeadsFilters = {
    view: 'sales',
    search: '',
    ownerMode: 'all',
    ownerIds: [],
    priority: [],
    status: [],
    origin: [],
    tags: [],
    nextAction: [],
    daysWithoutInteraction: null,
    orderBy: 'priority',
    page: 1,
  }

  const createMockActions = (): FilterActions => ({
    setSearch: vi.fn(),
    setView: vi.fn(),
    setOwnerMode: vi.fn(),
    setOwnerIds: vi.fn(),
    toggleMulti: vi.fn(),
    setMulti: vi.fn(),
    clearFilter: vi.fn(),
    clearAll: vi.fn(),
    setDaysWithoutInteraction: vi.fn(),
    setOrderBy: vi.fn(),
    setPage: vi.fn(),
  })

  it('renders the filter bar with all filter triggers', () => {
    const actions = createMockActions()
    render(
      <LeadsFiltersBar
        appliedFilters={defaultAppliedFilters}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        availableTags={mockTags}
        showNextActionFilter={false}
        activeFiltersCount={0}
      />
    )

    expect(screen.getByTestId('leads-filters-bar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Meus' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Status/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Prioridade/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Origem/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tags/i })).toBeInTheDocument()
  })

  it('shows Próxima ação filter only when showNextActionFilter is true', () => {
    const actions = createMockActions()
    const { rerender } = render(
      <LeadsFiltersBar
        appliedFilters={defaultAppliedFilters}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        showNextActionFilter={false}
        activeFiltersCount={0}
      />
    )

    expect(screen.queryByRole('button', { name: /Próxima ação/i })).not.toBeInTheDocument()

    rerender(
      <LeadsFiltersBar
        appliedFilters={defaultAppliedFilters}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        showNextActionFilter={true}
        activeFiltersCount={0}
      />
    )

    expect(screen.getByRole('button', { name: /Próxima ação/i })).toBeInTheDocument()
  })

  it('calls setOwnerMode when clicking Meus/Todos buttons', async () => {
    const user = userEvent.setup()
    const actions = createMockActions()
    
    render(
      <LeadsFiltersBar
        appliedFilters={defaultAppliedFilters}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        activeFiltersCount={0}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Meus' }))
    expect(actions.setOwnerMode).toHaveBeenCalledWith('me')

    await user.click(screen.getByRole('button', { name: 'Todos' }))
    expect(actions.setOwnerMode).toHaveBeenCalledWith('all')
  })

  it('shows clear button with count when filters are active', () => {
    const actions = createMockActions()
    
    const { rerender } = render(
      <LeadsFiltersBar
        appliedFilters={defaultAppliedFilters}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        activeFiltersCount={0}
      />
    )

    expect(screen.queryByRole('button', { name: /Limpar/i })).not.toBeInTheDocument()

    rerender(
      <LeadsFiltersBar
        appliedFilters={{ ...defaultAppliedFilters, status: ['status-1'] }}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        activeFiltersCount={2}
      />
    )

    const clearButton = screen.getByRole('button', { name: /Limpar/i })
    expect(clearButton).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls clearAll when clicking clear button', async () => {
    const user = userEvent.setup()
    const actions = createMockActions()
    
    render(
      <LeadsFiltersBar
        appliedFilters={{ ...defaultAppliedFilters, status: ['status-1'] }}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        activeFiltersCount={1}
      />
    )

    await user.click(screen.getByRole('button', { name: /Limpar/i }))
    expect(actions.clearAll).toHaveBeenCalled()
  })

  it('shows days without interaction value when set', () => {
    const actions = createMockActions()
    
    render(
      <LeadsFiltersBar
        appliedFilters={{ ...defaultAppliedFilters, daysWithoutInteraction: 7 }}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        activeFiltersCount={1}
      />
    )

    expect(screen.getByRole('button', { name: /7\+ dias/i })).toBeInTheDocument()
  })

  it('calls setMulti when status selection changes', async () => {
    const user = userEvent.setup()
    const actions = createMockActions()
    
    render(
      <LeadsFiltersBar
        appliedFilters={defaultAppliedFilters}
        actions={actions}
        users={mockUsers}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        activeFiltersCount={0}
      />
    )

    // Click status trigger to open popover
    await user.click(screen.getByRole('button', { name: /Status/i }))
    
    // Select a status
    await user.click(screen.getByText('Novo'))
    
    expect(actions.setMulti).toHaveBeenCalledWith('status', ['status-1'])
  })
})

describe('LeadsFiltersChips', () => {
  const mockLeadStatuses = [
    { id: 'status-1', code: 'new', label: 'Novo' },
  ]
  const mockLeadOrigins = [
    { id: 'origin-1', code: 'website', label: 'Website' },
  ]
  const mockTags: Tag[] = [
    { id: 'tag-1', name: 'Urgente', color: '#ff0000' },
  ] as Tag[]
  const mockUsers: User[] = [
    { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'analyst' },
  ]

  const defaultAppliedFilters: AppliedLeadsFilters = {
    view: 'sales',
    search: '',
    ownerMode: 'all',
    ownerIds: [],
    priority: [],
    status: [],
    origin: [],
    tags: [],
    nextAction: [],
    daysWithoutInteraction: null,
    orderBy: 'priority',
    page: 1,
  }

  const createMockActions = (): FilterActions => ({
    setSearch: vi.fn(),
    setView: vi.fn(),
    setOwnerMode: vi.fn(),
    setOwnerIds: vi.fn(),
    toggleMulti: vi.fn(),
    setMulti: vi.fn(),
    clearFilter: vi.fn(),
    clearAll: vi.fn(),
    setDaysWithoutInteraction: vi.fn(),
    setOrderBy: vi.fn(),
    setPage: vi.fn(),
  })

  it('returns null when no filters are active', () => {
    const actions = createMockActions()
    const { container } = render(
      <LeadsFiltersChips
        appliedFilters={defaultAppliedFilters}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
      />
    )

    expect(container.querySelector('[data-testid="leads-filters-chips"]')).not.toBeInTheDocument()
  })

  it('renders chips for active filters', () => {
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          status: ['status-1'],
          priority: ['hot'],
          daysWithoutInteraction: 7,
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
      />
    )

    expect(screen.getByTestId('leads-filters-chips')).toBeInTheDocument()
    expect(screen.getByText('Status: Novo')).toBeInTheDocument()
    expect(screen.getByText('Prioridade: Hot')).toBeInTheDocument()
    expect(screen.getByText('Sem interação há 7+ dias')).toBeInTheDocument()
  })

  it('renders owner chip when ownerMode is me', () => {
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          ownerMode: 'me',
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
      />
    )

    expect(screen.getByText('Responsável: Meus')).toBeInTheDocument()
  })

  it('renders custom owner chips with user names', () => {
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          ownerMode: 'custom',
          ownerIds: ['user-1'],
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        users={mockUsers}
      />
    )

    expect(screen.getByText('Responsável: John Doe')).toBeInTheDocument()
  })

  it('calls toggleMulti when clicking chip X', async () => {
    const user = userEvent.setup()
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          status: ['status-1'],
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
      />
    )

    // Find the badge using data-slot attribute and click it
    const badge = screen.getByText('Status: Novo').parentElement!
    await user.click(badge)
    
    expect(actions.toggleMulti).toHaveBeenCalledWith('status', 'status-1')
  })

  it('shows "Limpar tudo" when multiple chips exist', () => {
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          status: ['status-1'],
          priority: ['hot'],
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
      />
    )

    expect(screen.getByRole('button', { name: /Limpar tudo/i })).toBeInTheDocument()
  })

  it('calls clearAll when clicking "Limpar tudo"', async () => {
    const user = userEvent.setup()
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          status: ['status-1'],
          priority: ['hot'],
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
      />
    )

    await user.click(screen.getByRole('button', { name: /Limpar tudo/i }))
    expect(actions.clearAll).toHaveBeenCalled()
  })

  it('renders next action chips when showNextActionFilter is true', () => {
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          nextAction: ['call_first_time'],
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        showNextActionFilter={true}
      />
    )

    expect(screen.getByText('Ação: Fazer primeira ligação')).toBeInTheDocument()
  })

  it('does NOT render next action chips when showNextActionFilter is false', () => {
    const actions = createMockActions()
    render(
      <LeadsFiltersChips
        appliedFilters={{
          ...defaultAppliedFilters,
          nextAction: ['call_first_time'],
        }}
        actions={actions}
        leadStatuses={mockLeadStatuses}
        leadOrigins={mockLeadOrigins}
        showNextActionFilter={false}
      />
    )

    expect(screen.queryByText(/Ação:/)).not.toBeInTheDocument()
  })
})

describe('NEXT_ACTION_OPTIONS', () => {
  it('should have exactly 11 canonical options', () => {
    expect(NEXT_ACTION_OPTIONS).toHaveLength(11)
  })

  it('should have all expected codes', () => {
    const expectedCodes = [
      'prepare_for_meeting',
      'post_meeting_follow_up',
      'call_first_time',
      'handoff_to_deal',
      'qualify_to_company',
      'schedule_meeting',
      'call_again',
      'send_value_asset',
      'send_follow_up',
      'reengage_cold_lead',
      'disqualify',
    ]
    
    const actualCodes = NEXT_ACTION_OPTIONS.map(o => o.code)
    expect(actualCodes).toEqual(expectedCodes)
  })
})
