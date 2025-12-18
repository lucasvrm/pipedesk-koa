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

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <button>{children}</button>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
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

  it('renders owner mode buttons (Meus, Todos, Selecionar)', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByText('Meus')).toBeInTheDocument()
    expect(screen.getByText('Todos')).toBeInTheDocument()
    // Selecionar is inside a popover trigger
  })

  it('renders priority options (Hot, Warm, Cold)', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByText('Hot')).toBeInTheDocument()
    expect(screen.getByText('Warm')).toBeInTheDocument()
    expect(screen.getByText('Cold')).toBeInTheDocument()
  })

  it('renders days without interaction presets', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByText('3 dias')).toBeInTheDocument()
    expect(screen.getByText('7 dias')).toBeInTheDocument()
    expect(screen.getByText('14 dias')).toBeInTheDocument()
    expect(screen.getByText('Qualquer')).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when apply button is clicked', () => {
    const onOpenChange = vi.fn()
    render(<LeadsFilterPanel {...defaultProps} onOpenChange={onOpenChange} />)
    
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls setOwnerMode when owner mode button is clicked', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Meus'))
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setOwnerMode).toHaveBeenCalledWith('me')
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
    
    expect(screen.getByText('Filtros definidos pelo sistema')).toBeInTheDocument()
    expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
  })

  it('shows next action filter when showNextActionFilter is true', () => {
    render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
    
    // The next action filter appears as a label in the Activity section
    // Use getAllByText to account for the ordering option as well
    const nextActionLabels = screen.getAllByText('Próxima ação')
    expect(nextActionLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('hides next action filter when showNextActionFilter is false', () => {
    render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={false} />)
    
    // The label for next action should not be in the document when the filter is hidden
    const nextActionLabels = screen.queryAllByText('Próxima ação')
    // When showNextActionFilter=false, neither the filter nor the ordering section shows
    expect(nextActionLabels.length).toBe(0)
  })

  it('applies multiple filter changes in a single apply action', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    // Click owner mode
    fireEvent.click(screen.getByText('Meus'))
    
    // Click priority Hot
    fireEvent.click(screen.getByText('Hot'))
    
    // Click apply
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setOwnerMode).toHaveBeenCalledWith('me')
    expect(mockActions.setMulti).toHaveBeenCalledWith('priority', ['hot'])
  })

  describe('Ordering Section', () => {
    it('renders ordering section when showNextActionFilter is true', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      expect(screen.getByText('Ordenação')).toBeInTheDocument()
    })

    it('hides ordering section when showNextActionFilter is false', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={false} />)
      
      expect(screen.queryByText('Ordenação')).not.toBeInTheDocument()
    })

    it('renders all ordering options', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      // Check some ordering options are rendered
      expect(screen.getByTestId('ordering-option-priority')).toBeInTheDocument()
      expect(screen.getByTestId('ordering-option-last_interaction')).toBeInTheDocument()
      expect(screen.getByTestId('ordering-option-created_at')).toBeInTheDocument()
    })

    it('applies orderBy when apply button is clicked', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      // Click an ordering option
      fireEvent.click(screen.getByTestId('ordering-option-last_interaction'))
      
      // Click apply
      fireEvent.click(screen.getByTestId('filter-panel-apply'))
      
      expect(mockActions.setOrderBy).toHaveBeenCalledWith('last_interaction')
    })

    it('does not update URL immediately when ordering is changed (draft mode)', () => {
      render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
      
      // Click an ordering option
      fireEvent.click(screen.getByTestId('ordering-option-created_at'))
      
      // Before apply, setOrderBy should NOT be called
      expect(mockActions.setOrderBy).not.toHaveBeenCalled()
    })
  })
})
