import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LeadsSummaryCards } from '@/features/leads/components/LeadsSummaryCards'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} })
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('LeadsSummaryCards', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  const defaultProps = {
    openLeads: 42,
    createdThisMonth: 15,
    qualifiedThisMonth: 8,
    isLoading: false,
    isMetricsLoading: false,
    isMetricsError: false
  }

  // Basic rendering tests
  it('renders all three metrics cards when expanded', () => {
    render(<LeadsSummaryCards {...defaultProps} />)
    
    expect(screen.getByText('Leads em Aberto')).toBeInTheDocument()
    expect(screen.getByText('Criados no Mês')).toBeInTheDocument()
    expect(screen.getByText('Qualificados no Mês')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('renders toggle button with "Minimizar" text when expanded', () => {
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveTextContent('Minimizar')
  })

  // Toggle functionality tests
  it('collapses cards when toggle button is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    await user.click(toggleButton)
    
    // Wait for the state to update
    await waitFor(() => {
      // Collapsed indicator should be visible
      expect(screen.getByTestId('leads-summary-collapsed')).toBeInTheDocument()
    })
    expect(screen.getByText('Resumo oculto')).toBeInTheDocument()
  })

  it('expands cards when toggle button is clicked in collapsed state', async () => {
    // Start collapsed
    localStorageMock.getItem.mockReturnValue('1')
    const user = userEvent.setup()
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    expect(toggleButton).toHaveTextContent('Mostrar resumo')
    
    await user.click(toggleButton)
    
    // Cards should now be visible
    await waitFor(() => {
      expect(screen.getByTestId('leads-summary-cards')).toBeInTheDocument()
    })
  })

  // localStorage persistence tests
  it('persists collapsed state to localStorage', async () => {
    const user = userEvent.setup()
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    await user.click(toggleButton)
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('leads.summaryCards.collapsed', '1')
    })
  })

  it('persists expanded state to localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('1')
    const user = userEvent.setup()
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    await user.click(toggleButton)
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('leads.summaryCards.collapsed', '0')
    })
  })

  it('restores collapsed state from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValue('1')
    render(<LeadsSummaryCards {...defaultProps} />)
    
    // Should be collapsed - toggle button should show "Mostrar resumo"
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    expect(toggleButton).toHaveTextContent('Mostrar resumo')
    expect(screen.getByTestId('leads-summary-collapsed')).toBeInTheDocument()
  })

  it('restores expanded state from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValue('0')
    render(<LeadsSummaryCards {...defaultProps} />)
    
    // Should be expanded
    expect(screen.getByTestId('leads-summary-cards')).toBeInTheDocument()
  })

  // Accessibility tests
  it('has correct aria-expanded attribute when expanded', () => {
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('has correct aria-expanded attribute when collapsed', () => {
    localStorageMock.getItem.mockReturnValue('1')
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('has aria-controls attribute pointing to content', () => {
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const toggleButton = screen.getByTestId('leads-summary-toggle')
    expect(toggleButton).toHaveAttribute('aria-controls', 'leads-summary-cards-content')
  })

  // Loading state tests
  it('shows skeletons when isLoading is true', () => {
    // Ensure expanded state
    localStorageMock.getItem.mockReturnValue('0')
    render(<LeadsSummaryCards {...defaultProps} isLoading={true} />)
    
    const skeletons = screen.getAllByTestId('metric-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows skeletons for metrics when isMetricsLoading is true', () => {
    // Ensure expanded state
    localStorageMock.getItem.mockReturnValue('0')
    render(<LeadsSummaryCards {...defaultProps} isMetricsLoading={true} />)
    
    const skeletons = screen.getAllByTestId('metric-skeleton')
    expect(skeletons.length).toBe(2) // Created and Qualified metrics
  })

  // Error state tests
  it('shows dash (—) when isMetricsError is true', () => {
    // Ensure expanded state
    localStorageMock.getItem.mockReturnValue('0')
    render(<LeadsSummaryCards {...defaultProps} isMetricsError={true} />)
    
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(2) // Created and Qualified metrics show dash on error
  })

  // Collapsed state shows summary info
  it('shows summary info in collapsed state', () => {
    // Start collapsed via localStorage
    localStorageMock.getItem.mockReturnValue('1')
    render(<LeadsSummaryCards {...defaultProps} />)
    
    const collapsedIndicator = screen.getByTestId('leads-summary-collapsed')
    expect(collapsedIndicator).toHaveTextContent('42 leads em aberto')
    expect(collapsedIndicator).toHaveTextContent('15 criados')
    expect(collapsedIndicator).toHaveTextContent('8 qualificados')
  })

  it('does not show metrics in collapsed summary when loading', () => {
    localStorageMock.getItem.mockReturnValue('1')
    render(<LeadsSummaryCards {...defaultProps} isMetricsLoading={true} />)
    
    const collapsedIndicator = screen.getByTestId('leads-summary-collapsed')
    expect(collapsedIndicator).toHaveTextContent('42 leads em aberto')
    expect(collapsedIndicator).not.toHaveTextContent('criados')
  })

  it('does not show metrics in collapsed summary when error', () => {
    localStorageMock.getItem.mockReturnValue('1')
    render(<LeadsSummaryCards {...defaultProps} isMetricsError={true} />)
    
    const collapsedIndicator = screen.getByTestId('leads-summary-collapsed')
    expect(collapsedIndicator).toHaveTextContent('42 leads em aberto')
    expect(collapsedIndicator).not.toHaveTextContent('criados')
  })
})
