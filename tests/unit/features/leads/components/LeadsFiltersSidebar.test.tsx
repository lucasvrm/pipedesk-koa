import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeadsFiltersSidebar } from '@/features/leads/components/LeadsFiltersSidebar'
import type { AppliedLeadsFilters, FilterActions } from '@/features/leads/hooks/useLeadsFiltersSearchParams'

// Mock dependencies
vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: any) => <div>{children}</div>,
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
  CollapsibleTrigger: ({ children }: any) => <button>{children}</button>,
}))

vi.mock('@/components/ui/MultiSelectPopover', () => ({
  MultiSelectPopover: ({ placeholder, selected, onSelectionChange }: any) => (
    <button 
      data-testid={`multi-select-${placeholder.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={() => onSelectionChange(['test-id'])}
    >
      {placeholder} ({selected.length})
    </button>
  ),
}))

describe('LeadsFiltersSidebar', () => {
  const mockActions: FilterActions = {
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
  }

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

  const defaultProps = {
    appliedFilters: defaultAppliedFilters,
    actions: mockActions,
    users: [{ id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'analyst' as const, companyId: 'company-1', createdAt: '', updatedAt: '' }],
    leadStatuses: [{ id: 'status-1', code: 'new', label: 'Novo' }],
    leadOrigins: [{ id: 'origin-1', code: 'website', label: 'Website' }],
    availableTags: [{ id: 'tag-1', name: 'Hot Lead', color: '#ff0000', companyId: 'company-1' }],
    showNextActionFilter: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the sidebar with proper structure', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('leads-filters-sidebar')).toBeInTheDocument()
    expect(screen.getByText('Filtros')).toBeInTheDocument()
    expect(screen.getByText('Ajuste os filtros para refinar a lista')).toBeInTheDocument()
  })

  it('renders filter sections', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByText('Filtros definidos pelo sistema')).toBeInTheDocument()
    expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
  })

  it('renders apply and clear buttons', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('filter-panel-apply')).toBeInTheDocument()
    expect(screen.getByTestId('filter-panel-clear')).toBeInTheDocument()
  })

  it('renders owner mode buttons (Meus, Todos)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByText('Meus')).toBeInTheDocument()
    expect(screen.getByText('Todos')).toBeInTheDocument()
  })

  it('renders priority options (Hot, Warm, Cold)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByText('Hot')).toBeInTheDocument()
    expect(screen.getByText('Warm')).toBeInTheDocument()
    expect(screen.getByText('Cold')).toBeInTheDocument()
  })

  it('renders days without interaction presets', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByText('3 dias')).toBeInTheDocument()
    expect(screen.getByText('7 dias')).toBeInTheDocument()
    expect(screen.getByText('14 dias')).toBeInTheDocument()
    expect(screen.getByText('Qualquer')).toBeInTheDocument()
  })

  it('renders ordering section when showNextActionFilter is true', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    expect(screen.getByText('Ordenação')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-section-fixed')).toBeInTheDocument()
  })

  it('hides ordering section when showNextActionFilter is false', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={false} />)
    
    expect(screen.queryByText('Ordenação')).not.toBeInTheDocument()
  })

  it('is hidden by default when isOpen is false (not passed)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    // When isOpen=false (default), sidebar has only 'hidden' class (no md:flex)
    expect(sidebar.className).toContain('hidden')
    expect(sidebar.className).not.toContain('md:flex')
  })

  it('shows sidebar on md+ when isOpen is true', () => {
    render(<LeadsFiltersSidebar {...defaultProps} isOpen={true} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    // When isOpen=true, sidebar has 'hidden md:flex' classes
    expect(sidebar.className).toContain('hidden')
    expect(sidebar.className).toContain('md:flex')
  })

  it('has sticky positioning classes when open', () => {
    render(<LeadsFiltersSidebar {...defaultProps} isOpen={true} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    expect(sidebar.className).toContain('md:sticky')
    expect(sidebar.className).toContain('md:top-20')
    expect(sidebar.className).toContain('self-start')
  })

  it('has complete border styling (not just border-r)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} isOpen={true} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    // Should have full border, rounded corners, and shadow
    expect(sidebar.className).toContain('border')
    expect(sidebar.className).toContain('rounded-xl')
    expect(sidebar.className).toContain('shadow-sm')
    // Should NOT have only border-r
    expect(sidebar.className).not.toContain('border-r')
  })

  it('applies filters when apply button is clicked', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Click owner mode
    fireEvent.click(screen.getByText('Meus'))
    
    // Click apply
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setOwnerMode).toHaveBeenCalledWith('me')
  })

  it('clears draft filters when clear button is clicked', () => {
    const appliedWithFilters: AppliedLeadsFilters = {
      ...defaultAppliedFilters,
      priority: ['hot', 'warm'],
    }
    
    render(<LeadsFiltersSidebar {...defaultProps} appliedFilters={appliedWithFilters} />)
    
    fireEvent.click(screen.getByTestId('filter-panel-clear'))
    
    // After clear and apply, priority should be empty
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    expect(mockActions.setMulti).toHaveBeenCalledWith('priority', [])
  })

  it('displays both filter sections simultaneously', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Both sections should be visible at the same time (no need to collapse one to see the other)
    expect(screen.getByText('Filtros definidos pelo sistema')).toBeInTheDocument()
    expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
    
    // And ordering section if showNextActionFilter is true
    expect(screen.getByTestId('ordering-section-fixed')).toBeInTheDocument()
  })
})
