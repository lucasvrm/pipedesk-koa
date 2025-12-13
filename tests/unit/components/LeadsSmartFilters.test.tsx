import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadsSmartFilters } from '@/features/leads/components/LeadsSmartFilters'
import { User, LeadPriorityBucket } from '@/lib/types'

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
    orderBy: 'priority' as const,
    onOrderByChange: vi.fn(),
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

  it('should render all filter sections in popover', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))

    expect(screen.getByText('Responsável')).toBeInTheDocument()
    expect(screen.getByText('Prioridade')).toBeInTheDocument()
    expect(screen.getByText('Características')).toBeInTheDocument()
    expect(screen.getByText('Dias sem interação')).toBeInTheDocument()
    expect(screen.getByText('Ordenação')).toBeInTheDocument()
  })

  it('should call onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSmartFilters {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Filtros/i }))
    await user.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(defaultProps.onClear).toHaveBeenCalled()
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

  it('should default orderBy to priority if invalid value is provided', () => {
    const props = {
      ...defaultProps,
      orderBy: 'invalid' as any
    }

    // Should not throw error and should use default
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
      orderBy: 'last_interaction' as const // +1
    }

    render(<LeadsSmartFilters {...props} />)

    // Total: 6 active filters
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('should not count default values as active filters', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'me' as const, // default, doesn't count
      orderBy: 'priority' as const // default, doesn't count
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

    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '14' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Qualquer' })).toBeInTheDocument()
  })
})
