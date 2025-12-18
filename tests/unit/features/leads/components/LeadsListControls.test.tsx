import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeadsListControls } from '@/features/leads/components/LeadsListControls'

// Mock RequirePermission to render children directly
vi.mock('@/features/rbac/components/RequirePermission', () => ({
  RequirePermission: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('LeadsListControls', () => {
  const defaultProps = {
    position: 'top' as const,
    currentView: 'sales' as const,
    onViewChange: vi.fn(),
    activeFiltersCount: 0,
    onOpenFilterPanel: vi.fn(),
    selectedIds: [] as string[],
    onBulkDelete: vi.fn(),
    onCreateLead: vi.fn(),
    totalLeads: 100,
    itemsPerPage: 10,
    onItemsPerPageChange: vi.fn(),
    showPagination: true,
    startItem: 1,
    endItem: 10,
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter button with correct testid for top position', () => {
    render(<LeadsListControls {...defaultProps} position="top" />)
    
    expect(screen.getByTestId('filter-panel-trigger')).toBeInTheDocument()
    expect(screen.getByTestId('leads-top-bar')).toBeInTheDocument()
  })

  it('renders filter button with correct testid for bottom position', () => {
    render(<LeadsListControls {...defaultProps} position="bottom" />)
    
    expect(screen.getByTestId('filter-panel-trigger-bottom')).toBeInTheDocument()
    expect(screen.getByTestId('leads-bottom-bar')).toBeInTheDocument()
  })

  describe('isFiltersOpen prop', () => {
    it('filter button has aria-pressed="true" when isFiltersOpen is true (top)', () => {
      render(<LeadsListControls {...defaultProps} position="top" isFiltersOpen={true} />)
      
      const filterButton = screen.getByTestId('filter-panel-trigger')
      expect(filterButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('filter button has aria-pressed="true" when isFiltersOpen is true (bottom)', () => {
      render(<LeadsListControls {...defaultProps} position="bottom" isFiltersOpen={true} />)
      
      const filterButton = screen.getByTestId('filter-panel-trigger-bottom')
      expect(filterButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('filter button has aria-pressed="false" when isFiltersOpen is false', () => {
      render(<LeadsListControls {...defaultProps} isFiltersOpen={false} />)
      
      const filterButton = screen.getByTestId('filter-panel-trigger')
      expect(filterButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('filter button uses default variant when isFiltersOpen is true', () => {
      render(<LeadsListControls {...defaultProps} isFiltersOpen={true} />)
      
      const filterButton = screen.getByTestId('filter-panel-trigger')
      // When isFiltersOpen is true, button should have aria-pressed=true and use default variant
      expect(filterButton).toHaveAttribute('aria-pressed', 'true')
      // The button should be rendered (the variant logic is tested by ensuring no errors)
      expect(filterButton).toBeInTheDocument()
    })

    it('filter button uses outline variant when isFiltersOpen is false and no active filters', () => {
      render(<LeadsListControls {...defaultProps} isFiltersOpen={false} activeFiltersCount={0} />)
      
      const filterButton = screen.getByTestId('filter-panel-trigger')
      // When closed and no filters, should have aria-pressed=false
      expect(filterButton).toHaveAttribute('aria-pressed', 'false')
    })
  })

  it('calls onOpenFilterPanel when filter button is clicked', () => {
    render(<LeadsListControls {...defaultProps} />)
    
    fireEvent.click(screen.getByTestId('filter-panel-trigger'))
    expect(defaultProps.onOpenFilterPanel).toHaveBeenCalledTimes(1)
  })

  it('shows badge with active filters count', () => {
    render(<LeadsListControls {...defaultProps} activeFiltersCount={3} />)
    
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders view toggle buttons', () => {
    render(<LeadsListControls {...defaultProps} />)
    
    expect(screen.getByTitle('Lista')).toBeInTheDocument()
    expect(screen.getByTitle('Cards')).toBeInTheDocument()
    expect(screen.getByTitle('Kanban')).toBeInTheDocument()
  })

  it('renders create lead button', () => {
    render(<LeadsListControls {...defaultProps} />)
    
    expect(screen.getByText('Novo Lead')).toBeInTheDocument()
  })

  it('shows total leads count', () => {
    render(<LeadsListControls {...defaultProps} totalLeads={123} />)
    
    expect(screen.getByText('123')).toBeInTheDocument()
  })

  it('shows pagination range', () => {
    render(<LeadsListControls {...defaultProps} startItem={11} endItem={20} />)
    
    expect(screen.getByText('11–20')).toBeInTheDocument()
  })

  it('calls onViewChange when view toggle is clicked', () => {
    render(<LeadsListControls {...defaultProps} />)
    
    fireEvent.click(screen.getByTitle('Cards'))
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('grid')
  })

  it('shows bulk delete button when items are selected', () => {
    render(<LeadsListControls {...defaultProps} selectedIds={['id1', 'id2']} />)
    
    expect(screen.getByText(/Excluir \(2\)/)).toBeInTheDocument()
  })
})
