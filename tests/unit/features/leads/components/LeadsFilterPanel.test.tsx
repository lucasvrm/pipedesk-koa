import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeadsFilterPanel } from '@/features/leads/components/LeadsFilterPanel'
import type { AppliedLeadsFilters, FilterActions } from '@/features/leads/hooks/useLeadsFiltersSearchParams'

// Mock dependencies
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => open ? <div data-testid="sheet-root">{children}</div> : null,
  SheetContent: ({ children, className, 'data-testid': testId }: any) => <div className={className} data-testid={testId}>{children}</div>,
  SheetHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
  SheetDescription: ({ children }: any) => <p>{children}</p>,
  SheetFooter: ({ children, className }: any) => <div className={className} data-testid="leads-filters-footer">{children}</div>,
}))

// Mock collapsible just like sidebar test
vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, defaultOpen, 'data-testid': testId, className }: any) => (
    <div data-defaultopen={defaultOpen} data-testid={testId} className={className}>{children}</div>
  ),
  CollapsibleContent: ({ children, forceMount }: any) => <div data-forcemount={forceMount}>{children}</div>,
  CollapsibleTrigger: ({ children, className }: any) => <button className={className} aria-expanded="true">{children}</button>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={`badge ${className}`} data-testid="count-badge">{children}</span>
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

  it('renders correctly when open', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByTestId('leads-filter-panel')).toBeInTheDocument()
    expect(screen.getByTestId('leads-filter-panel-scroll')).toBeInTheDocument()
    expect(screen.getByText('Filtrar Leads')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<LeadsFilterPanel {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByTestId('leads-filter-panel')).not.toBeInTheDocument()
  })

  it('hides footer when no filters selected', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    // Check for footer
    expect(screen.queryByTestId('leads-filters-footer')).not.toBeInTheDocument()
  })

  it('shows footer when filters are selected', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    // Select a filter
    fireEvent.click(screen.getByTestId('priority-checkbox-hot'))
    
    // Footer should appear
    expect(screen.getByTestId('leads-filters-footer')).toBeInTheDocument()
  })

  it('renders filter sections', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    expect(screen.getByText('Filtros do sistema')).toBeInTheDocument()
    expect(screen.getByText('Atividade do lead')).toBeInTheDocument()
  })

  it('renders aria-expanded on collapsible triggers', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    const triggers = screen.getAllByText('Filtros do sistema').map(el => el.closest('button'))
    triggers.forEach(trigger => {
        if(trigger) expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('renders count badge when count > 0', () => {
    const propsWithFilters = {
        ...defaultProps,
        appliedFilters: {
            ...defaultAppliedFilters,
            status: ['status-1']
        }
    }
    render(<LeadsFilterPanel {...propsWithFilters} />)
    
    const badges = screen.getAllByTestId('count-badge')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('uses forceMount for collapsible content', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    // Checking mock implementation of CollapsibleContent
    const contents = document.querySelectorAll('[data-forcemount="true"]')
    expect(contents.length).toBeGreaterThan(0)
  })

  it('initializes draft from applied filters when opened', () => {
    const appliedWithFilters = {
      ...defaultAppliedFilters,
      priority: ['hot' as const]
    }
    
    const { rerender } = render(
      <LeadsFilterPanel {...defaultProps} isOpen={false} appliedFilters={appliedWithFilters} />
    )
    
    // Open panel
    rerender(<LeadsFilterPanel {...defaultProps} isOpen={true} appliedFilters={appliedWithFilters} />)
    
    // Priority 'hot' checkbox should be checked
    // Note: In real world this might be async, but here we sync in useEffect
    expect(screen.getByTestId('priority-checkbox-hot')).toBeChecked()
    
    // Footer should be visible
    expect(screen.getByTestId('leads-filters-footer')).toBeInTheDocument()
  })

  it('renders ordering section when showNextActionFilter is true (sales view)', () => {
    render(<LeadsFilterPanel {...defaultProps} showNextActionFilter={true} />)
    
    expect(screen.getByTestId('ordering-section')).toBeInTheDocument()
  })

  it('renders tags search input and clears it', () => {
    render(<LeadsFilterPanel {...defaultProps} />)

    const input = screen.getByTestId('tags-search-input')
    fireEvent.change(input, { target: { value: 'test' } })

    const clearBtn = screen.getByLabelText('Limpar busca de tags')
    expect(clearBtn).toBeInTheDocument()
    
    fireEvent.click(clearBtn)
    expect(input).toHaveValue('')
  })

  it('applies filters and closes panel', () => {
    render(<LeadsFilterPanel {...defaultProps} />)
    
    // Select filter
    fireEvent.click(screen.getByTestId('priority-checkbox-hot'))
    
    // Click apply
    fireEvent.click(screen.getByTestId('filter-panel-apply'))
    
    expect(mockActions.setMulti).toHaveBeenCalledWith('priority', ['hot'])
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('clears draft but keeps panel open', () => {
    const appliedWithFilters = {
      ...defaultAppliedFilters,
      priority: ['hot' as const]
    }

    render(<LeadsFilterPanel {...defaultProps} appliedFilters={appliedWithFilters} />)

    fireEvent.click(screen.getByTestId('filter-panel-clear'))

    expect(screen.queryByTestId('leads-filters-footer')).not.toBeInTheDocument()
    expect(defaultProps.onOpenChange).not.toHaveBeenCalled()
  })
})
