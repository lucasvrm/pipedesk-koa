import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LeadSalesRow } from '@/features/leads/components/LeadSalesRow'
import { ColumnWidthsProvider } from '@/features/leads/hooks/useResizableColumns'
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
    mutateAsync: vi.fn(),
    isPending: false
  })
}))

// Mock the tagService hooks
vi.mock('@/services/tagService', () => ({
  useTags: () => ({ data: [], isLoading: false }),
  useEntityTags: () => ({ data: [], isLoading: false }),
  useTagOperations: () => ({
    assign: { mutateAsync: vi.fn(), isPending: false },
    unassign: { mutateAsync: vi.fn(), isPending: false }
  }),
  createTag: vi.fn()
}))

// Mock the userService hooks
vi.mock('@/services/userService', () => ({
  useUsers: () => ({ data: [], isLoading: false })
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

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ColumnWidthsProvider>
            {ui}
          </ColumnWidthsProvider>
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  it('renders fallback when lastInteractionAt is invalid', () => {
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        lastInteractionAt="invalid-date"
        lastInteractionType="email"
      />
    )

    expect(screen.getByText('Nenhuma interação')).toBeInTheDocument()
    expect(screen.queryByText(/há/)).toBeNull()
  })

  it('renders status badge with correct label', () => {
    renderWithProviders(<LeadSalesRow {...baseLead} />)

    expect(screen.getByText('Novo')).toBeInTheDocument()
  })

  it('renders "Sem status" when status is not provided', () => {
    renderWithProviders(<LeadSalesRow {...baseLead} status={undefined} />)

    expect(screen.getByText('Sem status')).toBeInTheDocument()
  })

  it('calls onScheduleClick when calendar button is clicked', async () => {
    const onScheduleClick = vi.fn()
    const user = userEvent.setup()
    
    renderWithProviders(<LeadSalesRow {...baseLead} onScheduleClick={onScheduleClick} />)

    // Find the row and hover to make action buttons visible
    const row = screen.getByText('Empresa Teste').closest('tr')
    expect(row).toBeInTheDocument()
    
    if (row) {
      await user.hover(row)
    }

    // Find the calendar button by its orange styling (third button in the actions cell)
    const actionButtons = screen.getAllByRole('button')
    // Find the button with the orange color class
    const calendarButton = actionButtons.find(btn => 
      btn.className.includes('text-orange-600')
    )
    
    expect(calendarButton).toBeInTheDocument()
    if (calendarButton) {
      await user.click(calendarButton)
    }

    expect(onScheduleClick).toHaveBeenCalledTimes(1)
    expect(onScheduleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'lead-1',
        legalName: 'Empresa Teste'
      })
    )
  })

  it('renders calendar button', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<LeadSalesRow {...baseLead} />)

    const row = screen.getByText('Empresa Teste').closest('tr')
    if (row) {
      await user.hover(row)
    }
    
    // Check that a button with orange styling exists (calendar button)
    const actionButtons = screen.getAllByRole('button')
    const calendarButton = actionButtons.find(btn => 
      btn.className.includes('text-orange-600')
    )
    
    expect(calendarButton).toBeInTheDocument()
  })

  it('renders nextAction.label correctly from backend', () => {
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        nextAction={{ code: 'presentation', label: 'Apresentação' }}
      />
    )

    expect(screen.getByText('Apresentação')).toBeInTheDocument()
  })

  it('renders "Sem próxima ação" fallback when nextAction is undefined', () => {
    renderWithProviders(<LeadSalesRow {...baseLead} nextAction={undefined} />)

    expect(screen.getByText('Sem próxima ação')).toBeInTheDocument()
  })

  it('renders nextAction with reason when provided', () => {
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        nextAction={{
          code: 'follow_up',
          label: 'Follow-up',
          reason: 'Cliente solicitou mais informações'
        }}
      />
    )

    expect(screen.getByText('Follow-up')).toBeInTheDocument()
    expect(screen.getByText('Cliente solicitou mais informações')).toBeInTheDocument()
  })

  // Urgency Level Tests
  it('renders urgent styling (red) when nextAction is overdue', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        nextAction={{
          code: 'call',
          label: 'Ligar',
          dueAt: yesterday.toISOString()
        }}
      />
    )

    const badge = screen.getByText('Ligar').closest('[class*="border-l-red"]')
    expect(badge).toBeInTheDocument()
  })

  it('renders urgent styling (red) when nextAction is due today', () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0) // noon today
    
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        nextAction={{
          code: 'call',
          label: 'Ligar Hoje',
          dueAt: today.toISOString()
        }}
      />
    )

    const badge = screen.getByText('Ligar Hoje').closest('[class*="border-l-red"]')
    expect(badge).toBeInTheDocument()
  })

  it('renders important styling (yellow) when nextAction is due in 1-3 days', () => {
    const inTwoDays = new Date()
    inTwoDays.setDate(inTwoDays.getDate() + 2)
    
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        nextAction={{
          code: 'meeting',
          label: 'Reunião em breve',
          dueAt: inTwoDays.toISOString()
        }}
      />
    )

    const badge = screen.getByText('Reunião em breve').closest('[class*="border-l-yellow"]')
    expect(badge).toBeInTheDocument()
  })

  it('renders normal styling (blue) when nextAction is due in 4+ days', () => {
    const inFiveDays = new Date()
    inFiveDays.setDate(inFiveDays.getDate() + 5)
    
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        nextAction={{
          code: 'follow_up',
          label: 'Follow-up futuro',
          dueAt: inFiveDays.toISOString()
        }}
      />
    )

    const badge = screen.getByText('Follow-up futuro').closest('[class*="border-l-blue"]')
    expect(badge).toBeInTheDocument()
  })

  it('renders neutral styling (gray) when nextAction has no dueAt', () => {
    renderWithProviders(
      <LeadSalesRow
        {...baseLead}
        nextAction={{
          code: 'task',
          label: 'Tarefa sem prazo'
        }}
      />
    )

    const badge = screen.getByText('Tarefa sem prazo').closest('[class*="border-l-gray"]')
    expect(badge).toBeInTheDocument()
  })
})
