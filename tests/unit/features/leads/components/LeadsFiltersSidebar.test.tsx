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
    // Header was removed - just verify sidebar renders with content
    expect(screen.getByTestId('filter-panel-apply')).toBeInTheDocument()
    expect(screen.getByTestId('filter-panel-clear')).toBeInTheDocument()
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
    
    // Now the ordering is a popover trigger (no text "Ordenação" visible, just the popover button)
    expect(screen.getByTestId('ordering-section-fixed')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-popover-trigger')).toBeInTheDocument()
    expect(screen.getByTestId('filter-search-input')).toBeInTheDocument()
  })

  it('hides ordering section when showNextActionFilter is false', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={false} />)
    
    expect(screen.queryByTestId('ordering-section-fixed')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ordering-popover-trigger')).not.toBeInTheDocument()
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

  it('renders search input when showNextActionFilter is true', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    const searchInput = screen.getByTestId('filter-search-input')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('placeholder', 'Buscar leads...')
  })

  it('updates search draft when typing in search input', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    const searchInput = screen.getByTestId('filter-search-input')
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    expect(searchInput).toHaveValue('test search')
  })

  it('applies search when apply button is clicked', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    const searchInput = screen.getByTestId('filter-search-input')
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setSearch).toHaveBeenCalledWith('test search')
    expect(mockActions.setPage).toHaveBeenCalledWith(1)
  })

  it('clears search when clear button is clicked', () => {
    const appliedWithSearch: AppliedLeadsFilters = {
      ...defaultAppliedFilters,
      search: 'existing search',
    }
    
    render(<LeadsFiltersSidebar {...defaultProps} appliedFilters={appliedWithSearch} showNextActionFilter={true} />)
    
    fireEvent.click(screen.getByTestId('filter-panel-clear'))
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setSearch).toHaveBeenCalledWith('')
  })

  it('renders status checkboxes instead of popover', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Status checkboxes should be rendered
    expect(screen.getByTestId('status-checkbox-status-1')).toBeInTheDocument()
  })

  it('toggles status checkbox when clicked', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    const statusCheckbox = screen.getByTestId('status-checkbox-status-1')
    fireEvent.click(statusCheckbox)
    
    // Apply to verify the selection
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setMulti).toHaveBeenCalledWith('status', ['status-1'])
  })

  it('renders origin checkboxes instead of popover', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Origin checkboxes should be rendered
    expect(screen.getByTestId('origin-checkbox-origin-1')).toBeInTheDocument()
  })

  it('renders tag checkboxes with color indicator', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Tag checkboxes should be rendered
    expect(screen.getByTestId('tag-checkbox-tag-1')).toBeInTheDocument()
    expect(screen.getByText('Hot Lead')).toBeInTheDocument()
  })

  it('renders next action checkboxes when showNextActionFilter is true', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    // Next action checkboxes should be rendered
    expect(screen.getByTestId('next-action-checkbox-prepare_for_meeting')).toBeInTheDocument()
    expect(screen.getByText('Preparar para reunião')).toBeInTheDocument()
  })

  it('filters tags by local search', () => {
    const manyTags = [
      { id: 'tag-1', name: 'Hot Lead', color: '#ff0000', companyId: 'company-1' },
      { id: 'tag-2', name: 'Cold Lead', color: '#0000ff', companyId: 'company-1' },
      { id: 'tag-3', name: 'VIP', color: '#00ff00', companyId: 'company-1' },
    ]
    
    render(<LeadsFiltersSidebar {...defaultProps} availableTags={manyTags} />)
    
    const tagsSearchInput = screen.getByTestId('tags-search-input')
    fireEvent.change(tagsSearchInput, { target: { value: 'hot' } })
    
    // Only Hot Lead should be visible
    expect(screen.getByText('Hot Lead')).toBeInTheDocument()
    expect(screen.queryByText('Cold Lead')).not.toBeInTheDocument()
    expect(screen.queryByText('VIP')).not.toBeInTheDocument()
  })

  it('filters next actions by local search', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    const nextActionsSearchInput = screen.getByTestId('next-actions-search-input')
    fireEvent.change(nextActionsSearchInput, { target: { value: 'reunião' } })
    
    // Only reunion-related options should be visible
    expect(screen.getByText('Preparar para reunião')).toBeInTheDocument()
    expect(screen.getByText('Agendar reunião')).toBeInTheDocument()
    expect(screen.queryByText('Fazer primeira ligação')).not.toBeInTheDocument()
  })
})
