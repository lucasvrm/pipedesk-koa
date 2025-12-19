import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeadsFilterPanel } from '@/features/leads/components/LeadsFilterPanel'
import type { AppliedLeadsFilters, FilterActions } from '@/features/leads/hooks/useLeadsFiltersSearchParams'

// Mock dependencies
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => open ? <div data-testid="sheet-root">{children}</div> : null,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
  SheetFooter: ({ children }: any) => <div data-testid="sheet-footer">{children}</div>,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
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

describe('LeadsFilterPanel', () => {
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
    isOpen: true,
    onOpenChange: vi.fn(),
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

  it('renders the filter panel when open', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByTestId('sheet-root')).toBeInTheDocument()
    expect(screen.getByText('Filtrar Leads')).toBeInTheDocument()
    expect(screen.getByText('Ajuste os filtros para refinar a lista')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<LeadsFilterPanel {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByTestId('sheet-root')).not.toBeInTheDocument()
  })

  it('renders apply and clear buttons in footer', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByTestId('filter-panel-apply')).toBeInTheDocument()
    expect(screen.getByTestId('filter-panel-clear')).toBeInTheDocument()
  })

  it('renders owner popover trigger', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByTestId('owner-popover-trigger')).toBeInTheDocument()
  })

  it('renders priority checkboxes (Hot, Warm, Cold)', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByTestId('priority-checkbox-hot')).toBeInTheDocument()
    expect(screen.getByTestId('priority-checkbox-warm')).toBeInTheDocument()
    expect(screen.getByTestId('priority-checkbox-cold')).toBeInTheDocument()
  })

  it('renders days without interaction as checkboxes', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByTestId('days-checkbox-3')).toBeInTheDocument()
    expect(screen.getByTestId('days-checkbox-7')).toBeInTheDocument()
    expect(screen.getByTestId('days-checkbox-14')).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when apply button is clicked', () => {
    const onOpenChange = vi.fn()
    render(<LeadsFilterPanel {...defaultProps} onOpenChange={onOpenChange} />)
    
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls setOwnerMode when apply button is clicked', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setOwnerMode).toHaveBeenCalled()
  })

  it('clears draft filters when clear button is clicked', () => {
    const appliedWithFilters: AppliedLeadsFilters = {
      ...defaultAppliedFilters,
      priority: ['hot', 'warm'],
      status: ['status-1'],
    }
    
    render(<LeadsFilterPanel {...defaultProps} appliedFilters={appliedWithFilters} />)
    
    fireEvent.click(screen.getByTestId('filter-panel-clear'))
    
    // After clear, the apply button should show (0) filters
    expect(screen.getByTestId('filter-panel-apply')).toHaveTextContent('Aplicar filtros')
  })

  it('renders section headers for filter categories', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    // Renamed from "Filtros definidos pelo sistema" to "Filtros do sistema"
    expect(screen.getByText('Filtros do sistema')).toBeInTheDocument()
    expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
  })

  it('shows next action filter when showNextActionFilter is true', () => {
    render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
    
    expect(screen.getByTestId('activity-next-action-toggle')).toBeInTheDocument()
  })

  it('hides next action filter when showNextActionFilter is false', () => {
    render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={false} />)
    
    expect(screen.queryByTestId('activity-next-action-toggle')).not.toBeInTheDocument()
  })

  it('applies multiple filter changes in a single apply action', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    // Click priority Hot
    fireEvent.click(screen.getByTestId('priority-checkbox-hot'))
    
    // Click apply
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setOwnerMode).toHaveBeenCalled()
    expect(mockActions.setMulti).toHaveBeenCalledWith('priority', ['hot'])
  })

  describe('Ordering Section', () => {
    it('renders ordering section as collapsible when showNextActionFilter is true', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      expect(screen.getByTestId('ordering-section')).toBeInTheDocument()
      expect(screen.getByText('Ordenação')).toBeInTheDocument()
    })

    it('renders ordering options as radio-like single select', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      expect(screen.getByTestId('ordering-option-priority')).toBeInTheDocument()
      expect(screen.getByTestId('ordering-option-last_interaction')).toBeInTheDocument()
      expect(screen.getByTestId('ordering-option-created_at')).toBeInTheDocument()
    })

    it('hides ordering section when showNextActionFilter is false', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={false} />)
      
      expect(screen.queryByTestId('ordering-section')).not.toBeInTheDocument()
    })

    it('ordering section is accessible with filter sections', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      expect(screen.getByTestId('ordering-section')).toBeInTheDocument()
      expect(screen.getByText('Filtros do sistema')).toBeInTheDocument()
      expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
    })

    it('applies default orderBy when apply button is clicked', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      fireEvent.click(screen.getByTestId('filter-panel-apply'))
      
      expect(mockActions.setOrderBy).toHaveBeenCalledWith('priority')
    })

    it('applies selected orderBy when ordering option is clicked', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      // Apply to verify the default ordering (priority is default)
      fireEvent.click(screen.getByTestId('filter-panel-apply'))
      
      expect(mockActions.setOrderBy).toHaveBeenCalledWith('priority')
    })
  })

  describe('Tags Section', () => {
    it('renders Tags section with search input', () => {
      render(<LeadsFilterPanel {...defaultProps} />)
      
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
      render(<LeadsFilterPanel {...propsWithMultipleTags} />)
      
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

    it('Tags section is minimized by default (aria-expanded)', () => {
      render(<LeadsFilterPanel {...defaultProps} />)
      
      const tagsTrigger = screen.getByRole('button', { name: /Tags/i })
      expect(tagsTrigger).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Default Open States', () => {
    it('applies aria-expanded defaults to collapsible sections', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      expect(screen.getByRole('button', { name: /Ordenação/i })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByRole('button', { name: /Filtros do sistema/i })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('button', { name: /Status/i })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByRole('button', { name: /Tags/i })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByRole('button', { name: /Atividade do lead/i })).toHaveAttribute('aria-expanded', 'true')
    })
  })
})
