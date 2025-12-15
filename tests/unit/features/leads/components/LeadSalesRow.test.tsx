import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LeadSalesRow, getUrgencyLevel, truncateTags } from '@/features/leads/components/LeadSalesRow'
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
  createTag: vi.fn().mockResolvedValue({ id: 'new-tag', name: 'New Tag', color: '#000000' })
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

  it('renders fallback when lastInteractionAt is invalid', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow
            {...baseLead}
            lastInteractionAt="invalid-date"
            lastInteractionType="email"
          />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Nenhuma interação')).toBeInTheDocument()
    expect(screen.queryByText(/há/)).toBeNull()
  })

  it('renders status badge with correct label', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow {...baseLead} />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Novo')).toBeInTheDocument()
  })

  it('renders "Sem status" when status is not provided', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow {...baseLead} status={undefined} />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Sem status')).toBeInTheDocument()
  })

  it('calls onScheduleClick when calendar button is clicked', async () => {
    const onScheduleClick = vi.fn()
    const user = userEvent.setup()
    
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow {...baseLead} onScheduleClick={onScheduleClick} />
        </QueryClientProvider>
      </MemoryRouter>
    )

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
    
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow {...baseLead} />
        </QueryClientProvider>
      </MemoryRouter>
    )

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
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow
            {...baseLead}
            nextAction={{ code: 'presentation', label: 'Apresentação' }}
          />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Apresentação')).toBeInTheDocument()
  })

  it('renders "Sem próxima ação" fallback when nextAction is undefined', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow {...baseLead} nextAction={undefined} />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Sem próxima ação')).toBeInTheDocument()
  })

  it('renders nextAction with reason when provided', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <LeadSalesRow
            {...baseLead}
            nextAction={{
              code: 'follow_up',
              label: 'Follow-up',
              reason: 'Cliente solicitou mais informações'
            }}
          />
        </QueryClientProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Follow-up')).toBeInTheDocument()
    expect(screen.getByText('Cliente solicitou mais informações')).toBeInTheDocument()
  })
})

describe('truncateTags', () => {
  const tags = [
    { id: '1', name: 'Tag 1', color: '#111111' },
    { id: '2', name: 'Tag 2', color: '#222222' },
    { id: '3', name: 'Etiqueta longa', color: '#333333' }
  ]

  it('returns all tags when there is enough space', () => {
    const result = truncateTags(tags, 400)
    expect(result.visible).toHaveLength(tags.length)
    expect(result.hiddenCount).toBe(0)
  })

  it('hides overflowing tags when space is limited', () => {
    const result = truncateTags(tags, 80)
    expect(result.visible.length).toBeLessThan(tags.length)
    expect(result.hiddenCount).toBe(tags.length - result.visible.length)
  })
})

describe('getUrgencyLevel', () => {
  // Helper to create dates relative to today
  const getDateString = (daysFromNow: number): string => {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString()
  }

  it('returns "none" when dueAt is undefined', () => {
    expect(getUrgencyLevel(undefined)).toBe('none')
  })

  it('returns "none" when dueAt is null', () => {
    expect(getUrgencyLevel(null)).toBe('none')
  })

  it('returns "none" when dueAt is an invalid date string', () => {
    expect(getUrgencyLevel('invalid-date')).toBe('none')
  })

  it('returns "urgent" when dueAt is today', () => {
    const today = getDateString(0)
    expect(getUrgencyLevel(today)).toBe('urgent')
  })

  it('returns "urgent" when dueAt is in the past (overdue)', () => {
    const yesterday = getDateString(-1)
    expect(getUrgencyLevel(yesterday)).toBe('urgent')
  })

  it('returns "urgent" when dueAt is far in the past', () => {
    const lastWeek = getDateString(-7)
    expect(getUrgencyLevel(lastWeek)).toBe('urgent')
  })

  it('returns "important" when dueAt is tomorrow (1 day)', () => {
    const tomorrow = getDateString(1)
    expect(getUrgencyLevel(tomorrow)).toBe('important')
  })

  it('returns "important" when dueAt is in 2 days', () => {
    const twoDays = getDateString(2)
    expect(getUrgencyLevel(twoDays)).toBe('important')
  })

  it('returns "important" when dueAt is in 3 days', () => {
    const threeDays = getDateString(3)
    expect(getUrgencyLevel(threeDays)).toBe('important')
  })

  it('returns "normal" when dueAt is in 4 days', () => {
    const fourDays = getDateString(4)
    expect(getUrgencyLevel(fourDays)).toBe('normal')
  })

  it('returns "normal" when dueAt is in 7 days', () => {
    const sevenDays = getDateString(7)
    expect(getUrgencyLevel(sevenDays)).toBe('normal')
  })

  it('returns "normal" when dueAt is far in the future', () => {
    const nextMonth = getDateString(30)
    expect(getUrgencyLevel(nextMonth)).toBe('normal')
  })
})
