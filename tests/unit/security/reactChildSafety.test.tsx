import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LeadSalesRow } from '@/features/leads/components/LeadSalesRow'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'

vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    leadStatuses: [],
    leadOrigins: [],
    getLeadStatusById: () => undefined,
    getLeadOriginById: () => undefined,
    settings: []
  })
}))

describe('React child safety guards', () => {
  it('sanitizes object-like values in LeadSalesRow without crashing', () => {
    const { container } = render(
      <table>
        <tbody>
          <LeadSalesRow
            priorityBucket="warm"
            legalName={{ foo: 'bar' } as any}
            tradeName={{ foo: 'trade' } as any}
            priorityDescription={{ foo: 'desc' } as any}
            primaryContact={{ name: { complex: true } } as any}
            owner={{ name: { nested: true } } as any}
            tags={[{ id: '1', name: { raw: true } as any, color: { paint: true } as any }]}
          />
        </tbody>
      </table>
    )

    expect(screen.getByText('Lead sem nome')).toBeInTheDocument()
    expect(screen.getByText('Contato não informado')).toBeInTheDocument()
    expect(container.querySelector('table')).not.toBeNull()
  })

  it('filters invalid action labels in QuickActionsMenu', () => {
    const { container } = render(
      <QuickActionsMenu
        label={{ bad: 'label' } as any}
        actions={[{ id: 'bad', label: { nested: true } as any, onClick: () => {} } as any]}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
