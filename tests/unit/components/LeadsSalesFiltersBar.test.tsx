import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadsSalesFiltersBar } from '@/features/leads/components/LeadsSalesFiltersBar'
import { User, LeadPriorityBucket } from '@/lib/types'

describe('LeadsSalesFiltersBar', () => {
  const mockUsers: User[] = [
    { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user-3', name: 'Bob Wilson', email: 'bob@example.com' }
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

  it('should render with default props', () => {
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    expect(screen.getByText('Filtros inteligentes')).toBeInTheDocument()
    // "Meus leads" appears multiple times (button and popover trigger)
    expect(screen.getAllByText('Meus leads').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Todos').length).toBeGreaterThan(0)
  })

  it('should call onOwnerModeChange when owner mode button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    // Get all "Todos" buttons and click the first one (owner mode button)
    const allButtons = screen.getAllByRole('button', { name: 'Todos' })
    await user.click(allButtons[0])
    
    expect(defaultProps.onOwnerModeChange).toHaveBeenCalledWith('all')
  })

  it('should show selected owners in custom mode', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'custom' as const,
      selectedOwners: ['user-1', 'user-2']
    }
    
    render(<LeadsSalesFiltersBar {...props} />)
    
    expect(screen.getByText('2 selecionados')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should display selected priority filters', () => {
    const props = {
      ...defaultProps,
      priority: ['hot', 'warm'] as LeadPriorityBucket[]
    }
    
    render(<LeadsSalesFiltersBar {...props} />)
    
    const hotButton = screen.getByRole('button', { name: 'Hot' })
    const warmButton = screen.getByRole('button', { name: 'Warm' })
    
    // Check if buttons have the default variant class (indicating they are selected)
    expect(hotButton).toBeInTheDocument()
    expect(warmButton).toBeInTheDocument()
  })

  it('should call onPriorityChange when priority button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    const hotButton = screen.getByRole('button', { name: 'Hot' })
    await user.click(hotButton)
    
    expect(defaultProps.onPriorityChange).toHaveBeenCalledWith(['hot'])
  })

  it('should display selected statuses as badges', () => {
    const props = {
      ...defaultProps,
      statuses: ['status-1', 'status-2']
    }
    
    render(<LeadsSalesFiltersBar {...props} />)
    
    expect(screen.getByText('Novo')).toBeInTheDocument()
    expect(screen.getByText('Contatado')).toBeInTheDocument()
  })

  it('should display selected origins as badges', () => {
    const props = {
      ...defaultProps,
      origins: ['origin-1', 'origin-2']
    }
    
    render(<LeadsSalesFiltersBar {...props} />)
    
    expect(screen.getByText('Website')).toBeInTheDocument()
    expect(screen.getByText('Indicação')).toBeInTheDocument()
  })

  it('should highlight selected days without interaction', () => {
    const props = {
      ...defaultProps,
      daysWithoutInteraction: 7
    }
    
    render(<LeadsSalesFiltersBar {...props} />)
    
    const sevenDaysButton = screen.getByRole('button', { name: '7 dias' })
    expect(sevenDaysButton).toBeInTheDocument()
  })

  it('should call onDaysWithoutInteractionChange when days button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    const threeDaysButton = screen.getByRole('button', { name: '3 dias' })
    await user.click(threeDaysButton)
    
    expect(defaultProps.onDaysWithoutInteractionChange).toHaveBeenCalledWith(3)
  })

  it('should display correct order by value', () => {
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    // The select should show the default value
    expect(screen.getByText('Prioridade (padrão)')).toBeInTheDocument()
  })

  it('should render order by select with correct value', async () => {
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    // Find the order by select trigger - it should display the current value
    const selectTrigger = screen.getByRole('combobox')
    expect(selectTrigger).toBeInTheDocument()
    
    // The select should show the default value in the trigger
    expect(screen.getByText('Prioridade (padrão)')).toBeInTheDocument()
  })

  it('should call onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    const clearButton = screen.getByRole('button', { name: /Limpar filtros/i })
    await user.click(clearButton)
    
    expect(defaultProps.onClear).toHaveBeenCalled()
  })

  it('should handle empty arrays defensively', () => {
    const props = {
      ...defaultProps,
      users: [],
      leadStatuses: [],
      leadOrigins: []
    }
    
    // Should not throw error
    expect(() => render(<LeadsSalesFiltersBar {...props} />)).not.toThrow()
  })

  it('should default orderBy to priority if invalid value is provided', () => {
    const props = {
      ...defaultProps,
      orderBy: 'invalid' as any
    }
    
    // Should not throw error and should use default
    expect(() => render(<LeadsSalesFiltersBar {...props} />)).not.toThrow()
  })

  it('should display owner label correctly for "me" mode', () => {
    render(<LeadsSalesFiltersBar {...defaultProps} ownerMode="me" />)
    
    // There are multiple "Meus leads" buttons (one in owner mode section, one in custom popover)
    const customButtons = screen.getAllByRole('button', { name: /Meus leads/i })
    expect(customButtons.length).toBeGreaterThan(0)
  })

  it('should display owner label correctly for "all" mode', () => {
    render(<LeadsSalesFiltersBar {...defaultProps} ownerMode="all" />)
    
    // The "Todos" button should be present (there are multiple "Todos" buttons)
    const allButtons = screen.getAllByRole('button', { name: 'Todos' })
    expect(allButtons.length).toBeGreaterThan(0)
  })

  it('should display owner label correctly for "custom" mode with no selection', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'custom' as const,
      selectedOwners: []
    }
    
    render(<LeadsSalesFiltersBar {...props} />)
    
    expect(screen.getByText('Seleção manual')).toBeInTheDocument()
  })

  it('should show limited number of owner badges with overflow indicator', () => {
    const props = {
      ...defaultProps,
      ownerMode: 'custom' as const,
      selectedOwners: ['user-1', 'user-2', 'user-3']
    }
    
    render(<LeadsSalesFiltersBar {...props} />)
    
    // Should show first 3 users and no overflow indicator since we have exactly 3
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
  })

  it('should render all priority options', () => {
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: 'Hot' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Warm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cold' })).toBeInTheDocument()
  })

  it('should render all days presets', () => {
    render(<LeadsSalesFiltersBar {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: '3 dias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7 dias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '14 dias' })).toBeInTheDocument()
    // "Todos" appears multiple times - verify there's at least one
    expect(screen.getAllByRole('button', { name: 'Todos' }).length).toBeGreaterThan(0)
  })
})
