import { render, screen } from '@testing-library/react'
import { LeadSalesRow } from '@/features/leads/components/LeadSalesRow'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'

describe('LeadSalesRow', () => {
  const baseLead: LeadSalesViewItem = {
    leadId: 'lead-1',
    priorityBucket: 'warm',
    legalName: 'Empresa Teste',
    primaryContact: { name: 'Contato Principal' },
    nextAction: { code: 'call', label: 'Ligar' },
    owner: { name: 'Responsável' },
    tags: []
  }

  it('renders fallback when lastInteractionAt is invalid', () => {
    render(
      <LeadSalesRow
        {...baseLead}
        lastInteractionAt="invalid-date"
        lastInteractionType="email"
      />
    )

    expect(screen.getByText('Nenhuma interação')).toBeInTheDocument()
    expect(screen.queryByText(/há/)).toBeNull()
  })
})
