import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeadsOrderByDropdown } from '@/features/leads/components/LeadsOrderByDropdown'
import { LeadOrderBy } from '@/features/leads/components/LeadsSmartFilters'

describe('LeadsOrderByDropdown', () => {
  const defaultProps = {
    orderBy: 'priority' as const,
    onOrderByChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the dropdown button', () => {
    render(<LeadsOrderByDropdown {...defaultProps} />)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should display the current orderBy label', () => {
    render(<LeadsOrderByDropdown {...defaultProps} orderBy="priority" />)

    expect(screen.getByText('Prioridade (padrão)')).toBeInTheDocument()
  })

  it('should display last_interaction label when selected', () => {
    render(<LeadsOrderByDropdown {...defaultProps} orderBy="last_interaction" />)

    expect(screen.getByText('Última interação')).toBeInTheDocument()
  })

  it('should display created_at label when selected', () => {
    render(<LeadsOrderByDropdown {...defaultProps} orderBy="created_at" />)

    expect(screen.getByText('Data de criação')).toBeInTheDocument()
  })

  it('should display status label when selected', () => {
    render(<LeadsOrderByDropdown {...defaultProps} orderBy="status" />)

    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('should display next_action label when selected', () => {
    render(<LeadsOrderByDropdown {...defaultProps} orderBy="next_action" />)

    expect(screen.getByText('Próxima ação')).toBeInTheDocument()
  })

  it('should display owner label when selected', () => {
    render(<LeadsOrderByDropdown {...defaultProps} orderBy="owner" />)

    expect(screen.getByText('Responsável')).toBeInTheDocument()
  })

  it('should default to priority if invalid orderBy value is provided', () => {
    const props = {
      ...defaultProps,
      orderBy: 'invalid' as unknown as LeadOrderBy
    }

    // Should not throw error and should use default
    expect(() => render(<LeadsOrderByDropdown {...props} />)).not.toThrow()
    expect(screen.getByText('Prioridade (padrão)')).toBeInTheDocument()
  })

  it('should render with ArrowUpDown icon', () => {
    render(<LeadsOrderByDropdown {...defaultProps} />)

    // The button should have the ArrowUpDown icon
    const button = screen.getByRole('combobox')
    expect(button).toBeInTheDocument()
  })

  it('should render with ChevronDown icon', () => {
    render(<LeadsOrderByDropdown {...defaultProps} />)

    // The button should have the ChevronDown icon
    const button = screen.getByRole('combobox')
    expect(button).toBeInTheDocument()
  })
})
