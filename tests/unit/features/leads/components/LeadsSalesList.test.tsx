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

  it('renders safely when lead has malformed user-facing data', () => {
    const leads: LeadSalesViewItem[] = [
      {
        id: 'malformed',
        priorityBucket: 'warm',
        legalName: 'Lead com dados inválidos',
        nextAction: {
          code: 'call',
          // @ts-expect-error testing resilience to malformed API payloads
          label: { text: 'Invalid label' },
          // @ts-expect-error testing resilience to malformed API payloads
          reason: { message: 'Invalid reason' }
        },
        tags: [
          // @ts-expect-error testing resilience to malformed API payloads
          { id: 'tag-1', name: { nested: true }, color: { invalid: true } },
          { id: 'tag-2', name: 'Válida', color: '#ff0000' }
        ]
      }
    ]

    expect(() => render(<LeadsSalesList {...baseProps} leads={leads} />)).not.toThrow()

    expect(screen.getByText('Tag')).toBeInTheDocument()
    expect(screen.getByText('Válida')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
