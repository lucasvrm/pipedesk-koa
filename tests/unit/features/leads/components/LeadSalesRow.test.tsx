import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { LeadSalesRow } from '@/features/leads/components/LeadSalesRow'
import { LeadSalesViewItem } from '@/services/leadsSalesViewService'

// Mock the SystemMetadata context
vi.mock('@/hooks/useSystemMetadata', () => ({
  useSystemMetadata: () => ({
    getLeadStatusById: (id: string) => {
      const statuses: Record<string, { id: string; label: string; code: string }> = {
        'status-1': { id: 'status-1', label: 'Novo', code: 'new' },
        'status-2': { id: 'status-2', label: 'Contatado', code: 'contacted' }
      }
      return statuses[id] || null
    },
    leadStatuses: [
      { id: 'status-1', code: 'new', label: 'Novo', isActive: true, sortOrder: 1, createdAt: '' },
      { id: 'status-2', code: 'contacted', label: 'Contatado', isActive: true, sortOrder: 2, createdAt: '' }
    ]
  })
}))

// Mock the updateLead hook
vi.mock('@/services/leadService', () => ({
  useUpdateLead: () => ({
    mutateAsync: vi.fn()
  })
}))

describe('LeadSalesRow', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const baseLead: LeadSalesViewItem = {
    id: 'lead-1',
    leadId: 'lead-1',
    priorityBucket: 'warm',
    legalName: 'Empresa Teste',
    primaryContact: { name: 'Contato Principal' },
    nextAction: { code: 'call', label: 'Ligar' },
    owner: { name: 'Responsável' },
    tags: [],
    status: 'status-1'
  }

  it('renders fallback when lastInteractionAt is invalid', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeadSalesRow
          {...baseLead}
          lastInteractionAt="invalid-date"
          lastInteractionType="email"
        />
      </QueryClientProvider>
    )

    expect(screen.getByText('Nenhuma interação')).toBeInTheDocument()
    expect(screen.queryByText(/há/)).toBeNull()
  })

  it('renders status badge with correct label', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeadSalesRow {...baseLead} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Novo')).toBeInTheDocument()
  })

  it('renders "Sem status" when status is not provided', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LeadSalesRow {...baseLead} status={undefined} />
      </QueryClientProvider>
    )

    expect(screen.getByText('Sem status')).toBeInTheDocument()
  })
})
