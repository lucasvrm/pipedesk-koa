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

  // Sheet behavior tests
  it('should open sheet (not popover) when filters button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    const filtersButton = screen.getByRole('button', { name: /Filtros/i })
    await user.click(filtersButton)

    // Sheet should have header with title "Filtros" and description
    expect(screen.getByText('Ajuste os filtros para refinar a lista')).toBeInTheDocument()
    // Should have "Limpar tudo" action in header
    expect(screen.getByRole('button', { name: /Limpar tudo/i })).toBeInTheDocument()
    // Should NOT have textual "Fechar" button (removed per spec - use X from Sheet)
    expect(screen.queryByRole('button', { name: /^Fechar$/i })).not.toBeInTheDocument()
  })

  it('should close sheet when clicking Cancelar in footer', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    expect(screen.getByText('Ajuste os filtros para refinar a lista')).toBeInTheDocument()

    // Use Cancelar button in footer to close
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))
    await waitFor(() => expect(screen.queryByText('Ajuste os filtros para refinar a lista')).not.toBeInTheDocument())
  })

  it('shows essential filters section with Responsável, Status, and Prioridade', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} availableTags={mockTags} selectedTags={[]} onTagsChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByText('Essenciais')).toBeInTheDocument()
    expect(screen.getByText('Responsável')).toBeInTheDocument()
    expect(screen.getByText(/Prioridade/)).toBeInTheDocument()
    expect(screen.getByText(/Status/)).toBeInTheDocument()
  })

  it('should have fixed footer with Cancelar and Aplicar filtros buttons', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Aplicar filtros/i })).toBeInTheDocument()
  })

  // Draft mode tests
  it('changes in sheet do NOT update URL until Aplicar filtros is clicked', async () => {
    const user = userEvent.setup()
    const onPriorityChange = vi.fn()
    render(<LeadsSmartFilters {...defaultProps} onPriorityChange={onPriorityChange} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    
    // Click Hot priority in draft mode
    const hotButton = screen.getByRole('button', { name: 'Hot' })
    await user.click(hotButton)

    // The callback should NOT have been called yet (draft mode)
    expect(onPriorityChange).not.toHaveBeenCalled()

    // Now click Aplicar filtros
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }))

    // Now the callback should be called
    expect(onPriorityChange).toHaveBeenCalledWith(['hot'])
  })

  it('Cancelar button discards draft changes and closes sheet', async () => {
    const user = userEvent.setup()
    const onPriorityChange = vi.fn()
    render(<LeadsSmartFilters {...defaultProps} onPriorityChange={onPriorityChange} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    
    // Click Hot priority in draft mode
    await user.click(screen.getByRole('button', { name: 'Hot' }))

    // Click Cancelar
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    // Sheet should be closed
    await waitFor(() => expect(screen.queryByText('Ajuste os filtros para refinar a lista')).not.toBeInTheDocument())
    
    // The callback should NOT have been called
    expect(onPriorityChange).not.toHaveBeenCalled()
  })

  it('Limpar tudo clears draft filters but does not close sheet', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} priority={['hot']} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    // The summary should show the filter chip
    expect(screen.getByLabelText(/Remover filtro Prioridade/i)).toBeInTheDocument()

    // Click Limpar tudo
    await user.click(screen.getByRole('button', { name: /Limpar tudo/i }))

    // Sheet should still be open
    expect(screen.getByText('Ajuste os filtros para refinar a lista')).toBeInTheDocument()

    // But the chip should be gone
    await waitFor(() => expect(screen.queryByLabelText(/Remover filtro Prioridade/i)).not.toBeInTheDocument())
  })

  // Summary chips tests
  it('shows summary chips for draft filters', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} statuses={['status-1']} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    // Should show status chip in summary
    expect(screen.getByLabelText(/Remover filtro Status/i)).toBeInTheDocument()
  })

  it('shows empty state when no draft filters', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByText('Nenhum filtro aplicado')).toBeInTheDocument()
  })

  it('removing chip updates draft filters', async () => {
    const user = userEvent.setup()
    const onStatusesChange = vi.fn()
    render(<LeadsSmartFilters {...defaultProps} statuses={['status-1']} onStatusesChange={onStatusesChange} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    const removeChip = screen.getByLabelText(/Remover filtro Status/i)
    await user.click(removeChip)

    // Chip should be gone in draft
    await waitFor(() => expect(screen.queryByLabelText(/Remover filtro Status/i)).not.toBeInTheDocument())

    // But callback not called until apply
    expect(onStatusesChange).not.toHaveBeenCalled()
  })

  // Active filter badges outside sheet
  it('should display active filter badges outside sheet', () => {
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

  // Priority pill group tests
  it('should render priority options as pill group', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByRole('button', { name: 'Hot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Warm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cold' })).toBeInTheDocument()
  })

  // Advanced filters (Accordion) tests
  it('should have advanced filters in collapsed accordion', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    // Origem accordion should exist
    expect(screen.getByRole('button', { name: /Origem/i })).toBeInTheDocument()
    // Dias sem interação accordion should exist
    expect(screen.getByRole('button', { name: /Dias sem interação/i })).toBeInTheDocument()
  })

  it('should expand dias sem interação accordion and show presets', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    
    // Click to expand accordion
    await user.click(screen.getByRole('button', { name: /Dias sem interação/i }))

    expect(screen.getByRole('button', { name: /3 dias/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /7 dias/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /14 dias/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Qualquer/i })).toBeInTheDocument()
  })

  // Defensive tests
  it('should handle empty arrays defensively', () => {
    const props = {
      ...defaultProps,
      users: [],
      leadStatuses: [],
      leadOrigins: []
    }

    expect(() => render(<LeadsSmartFilters {...props} />)).not.toThrow()
  })

  it('should count active filters correctly', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'all' as const,
      priority: ['hot', 'warm'] as LeadPriorityBucket[],
      statuses: ['status-1', 'status-2'],
      origins: ['origin-1'],
      daysWithoutInteraction: 7,
    }

    render(<LeadsSmartFilters {...props} />)
    // Total: 5 active filters
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should not count default values as active filters', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'me' as const,
    }

    render(<LeadsSmartFilters {...props} />)

    const button = screen.getByRole('button', { name: /Filtros/i })
    expect(button.textContent).not.toMatch(/\d+/)
  })

  // Next Action tests (view=sales)
  it('renders next action section when showNextActionFilter is true', async () => {
    const user = userEvent.setup()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        showNextActionFilter
        nextActions={[]}
        onNextActionsChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    
    // Next action section should be visible in essentials
    expect(screen.getByText(/Próxima ação/)).toBeInTheDocument()
  })

  it('does NOT render next action section when showNextActionFilter is false', async () => {
    const user = userEvent.setup()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        showNextActionFilter={false}
        nextActions={[]}
        onNextActionsChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    // Should NOT show "Próxima ação" section
    expect(screen.queryByText(/Próxima ação/)).not.toBeInTheDocument()
  })

  it('renders all 11 canonical next action options for Sales View', async () => {
    const user = userEvent.setup()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        showNextActionFilter
        nextActions={[]}
        onNextActionsChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    // Verify all 11 canonical options are in the Command list
    const canonicalOptions = [
      'Preparar para reunião',
      'Follow-up pós-reunião',
      'Fazer primeira ligação',
      'Fazer handoff (para deal)',
      'Qualificar para empresa',
      'Agendar reunião',
      'Ligar novamente',
      'Enviar material / valor',
      'Enviar follow-up',
      'Reengajar lead frio',
      'Desqualificar / encerrar'
    ]

    for (const optionLabel of canonicalOptions) {
      expect(screen.getByText(optionLabel)).toBeInTheDocument()
    }
  })

  it('includes next action selection in draft filter chips', async () => {
    const user = userEvent.setup()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        showNextActionFilter
        nextActions={['call_first_time', 'send_follow_up']}
        onNextActionsChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    // Should show in summary chips
    expect(screen.getByLabelText(/Remover filtro Próxima ação/)).toBeInTheDocument()
  })

  it('applies next action filter correctly', async () => {
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
    
    // Click on an action
    await user.click(screen.getByText('Enviar follow-up'))

    // Should not be called yet (draft mode)
    expect(onNextActionsChange).not.toHaveBeenCalled()

    // Apply filters
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }))

    expect(onNextActionsChange).toHaveBeenCalledWith(['send_follow_up'])
  })

  it('has Selecionar tudo and Limpar actions for next action', async () => {
    const user = userEvent.setup()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        showNextActionFilter
        nextActions={[]}
        onNextActionsChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByRole('button', { name: /Selecionar tudo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Limpar$/i })).toBeInTheDocument()
  })

  // Tags in accordion
  it('should have tags accordion when onTagsChange is provided', async () => {
    const user = userEvent.setup()
    render(
      <LeadsSmartFilters
        {...defaultProps}
        availableTags={mockTags}
        selectedTags={[]}
        onTagsChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByRole('button', { name: /Tags/i })).toBeInTheDocument()
  })
})
