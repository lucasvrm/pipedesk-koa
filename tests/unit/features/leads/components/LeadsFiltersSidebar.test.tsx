import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeadsFiltersSidebar } from '@/features/leads/components/LeadsFiltersSidebar'
import type { AppliedLeadsFilters, FilterActions } from '@/features/leads/hooks/useLeadsFiltersSearchParams'

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
    expect(screen.getByTestId('filter-panel-apply')).toBeInTheDocument()
    expect(screen.getByTestId('filter-panel-clear')).toBeInTheDocument()
  })

  it('renders filter sections', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Renamed from "Filtros definidos pelo sistema" to "Filtros do sistema"
    expect(screen.getByText('Filtros do sistema')).toBeInTheDocument()
    expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
  })

  it('renders apply and clear buttons', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('filter-panel-apply')).toBeInTheDocument()
    expect(screen.getByTestId('filter-panel-clear')).toBeInTheDocument()
  })

  it('renders owner popover trigger', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Now Responsável is a single Popover trigger
    expect(screen.getByTestId('owner-popover-trigger')).toBeInTheDocument()
  })

  it('renders priority options (Hot, Warm, Cold) with checkboxes', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('priority-checkbox-hot')).toBeInTheDocument()
    expect(screen.getByTestId('priority-checkbox-warm')).toBeInTheDocument()
    expect(screen.getByTestId('priority-checkbox-cold')).toBeInTheDocument()
  })

  it('renders days without interaction as checkboxes', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('days-checkbox-3')).toBeInTheDocument()
    expect(screen.getByTestId('days-checkbox-7')).toBeInTheDocument()
    expect(screen.getByTestId('days-checkbox-14')).toBeInTheDocument()
  })

  it('renders ordering section as collapsible when showNextActionFilter is true', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    expect(screen.getByTestId('ordering-section')).toBeInTheDocument()
    expect(screen.getByText('Ordenação')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-option-priority')).toBeInTheDocument()
  })

  it('hides ordering section when showNextActionFilter is false', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={false} />)
    
    expect(screen.queryByTestId('ordering-section')).not.toBeInTheDocument()
    expect(screen.queryByText('Ordenação')).not.toBeInTheDocument()
  })

  it('is hidden by default when isOpen is false (not passed)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    expect(sidebar.className).toContain('hidden')
    expect(sidebar.className).not.toContain('md:flex')
  })

  it('shows sidebar on md+ when isOpen is true', () => {
    render(<LeadsFiltersSidebar {...defaultProps} isOpen={true} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    expect(sidebar.className).toContain('hidden')
    expect(sidebar.className).toContain('md:flex')
  })

  it('has flex layout with min-h-0 for independent scroll (replaces sticky)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} isOpen={true} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    // Note: sticky removed - sidebar now uses flex stretch with min-h-0 for independent scroll
    // The sidebar scrolls independently within its container (no page scroll)
    expect(sidebar.className).toContain('min-h-0')
    expect(sidebar.className).toContain('overflow-hidden')
    expect(sidebar.className).toContain('flex-col')
  })

  it('has complete border styling (not just border-r)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} isOpen={true} />)
    
    const sidebar = screen.getByTestId('leads-filters-sidebar')
    expect(sidebar.className).toContain('border')
    expect(sidebar.className).toContain('rounded-xl')
    expect(sidebar.className).toContain('shadow-sm')
    expect(sidebar.className).not.toContain('border-r')
  })

  it('applies filters when apply button is clicked', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    // Click apply
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setOwnerMode).toHaveBeenCalled()
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
    
    expect(screen.getByText('Filtros do sistema')).toBeInTheDocument()
    expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
  })

  it('renders status checkboxes', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
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

  it('renders origin checkboxes', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('origin-checkbox-origin-1')).toBeInTheDocument()
  })

  it('renders tag checkboxes with color indicator', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('tag-checkbox-tag-1')).toBeInTheDocument()
    expect(screen.getByText('Hot Lead')).toBeInTheDocument()
  })

  it('renders next action checkboxes when showNextActionFilter is true', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    expect(screen.getByTestId('next-action-checkbox-prepare_for_meeting')).toBeInTheDocument()
    expect(screen.getByText('Preparar para reunião')).toBeInTheDocument()
  })

  it('renders ordering options as radio-like single select', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    // All ordering options should be present
    expect(screen.getByTestId('ordering-option-priority')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-option-last_interaction')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-option-created_at')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-option-status')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-option-next_action')).toBeInTheDocument()
    expect(screen.getByTestId('ordering-option-owner')).toBeInTheDocument()
  })

  it('applies orderBy when ordering option is selected', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    // Apply to verify the default selection (priority is default)
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setOrderBy).toHaveBeenCalledWith('priority')
  })

  it('renders Status section as collapsible (minimized by default)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('system-status-toggle')).toBeInTheDocument()
  })

  it('renders Tags section as collapsible (minimized by default)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('system-tags-toggle')).toBeInTheDocument()
  })

  it('renders Tags section with search input', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    expect(screen.getByTestId('tags-search-input')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar tag...')).toBeInTheDocument()
  })

  it('filters tags when search query is entered', () => {
    const propsWithMultipleTags = {
      ...defaultProps,
      availableTags: [
        { id: 'tag-1', name: 'Hot Lead', color: '#ff0000', companyId: 'company-1' },
        { id: 'tag-2', name: 'Cold Lead', color: '#0000ff', companyId: 'company-1' },
      ],
    }
    render(<LeadsFiltersSidebar {...propsWithMultipleTags} />)
    
    // Both tags should be visible initially
    expect(screen.getByTestId('tag-checkbox-tag-1')).toBeInTheDocument()
    expect(screen.getByTestId('tag-checkbox-tag-2')).toBeInTheDocument()
    
    // Type search query
    const searchInput = screen.getByTestId('tags-search-input')
    fireEvent.change(searchInput, { target: { value: 'Hot' } })
    
    // Only Hot Lead should be visible
    expect(screen.getByTestId('tag-checkbox-tag-1')).toBeInTheDocument()
    expect(screen.queryByTestId('tag-checkbox-tag-2')).not.toBeInTheDocument()
  })

  it('shows message when no tags match search', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)
    
    const searchInput = screen.getByTestId('tags-search-input')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    
    expect(screen.getByText('Nenhuma tag encontrada')).toBeInTheDocument()
  })

  it('applies expected aria-expanded defaults to collapsible sections', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)

    expect(screen.getByRole('button', { name: /Ordenação/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: /Filtros do sistema/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Status/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: /Atividade do lead/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps the footer sticky when any filter is selected', () => {
    const appliedWithFilters: AppliedLeadsFilters = {
      ...defaultAppliedFilters,
      status: ['status-1'],
    }

    render(<LeadsFiltersSidebar {...defaultProps} appliedFilters={appliedWithFilters} />)

    const footer = screen.getByTestId('leads-filters-footer')
    expect(footer.className).toContain('sticky')
    expect(footer.className).toContain('bottom-0')
  })

  it('does not stick the footer when no filters are selected', () => {
    render(<LeadsFiltersSidebar {...defaultProps} />)

    const footer = screen.getByTestId('leads-filters-footer')
    expect(footer.className).not.toContain('sticky')
  })

  it('renders Next Action section as collapsible (minimized by default)', () => {
    render(<LeadsFiltersSidebar {...defaultProps} showNextActionFilter={true} />)
    
    expect(screen.getByTestId('activity-next-action-toggle')).toBeInTheDocument()
  })
})
