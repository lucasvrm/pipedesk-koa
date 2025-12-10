import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeadsSalesList } from '@/features/leads/components/LeadsSalesList'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'

describe('LeadsSalesList', () => {
  const baseProps = {
    isLoading: false,
    orderBy: 'priority' as const,
    selectedIds: [],
    onSelectAll: vi.fn(),
    onSelectOne: vi.fn(),
    onNavigate: vi.fn()
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error state when leads have no identifiers', () => {
    const leads: LeadSalesViewItem[] = [
      {
        priorityBucket: 'hot',
        legalName: 'Lead sem ID'
      }
    ]

    render(<LeadsSalesList {...baseProps} leads={leads} />)

    expect(screen.getByText('Não foi possível exibir os leads')).toBeInTheDocument()
    expect(screen.getByText(/dados retornados estão incompletos/i)).toBeInTheDocument()
    expect(console.warn).toHaveBeenCalled()
  })
})
