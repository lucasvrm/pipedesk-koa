import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
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

// Mock lead hooks
vi.mock('@/services/leadService', async () => {
  const actual = await vi.importActual<typeof import('@/services/leadService')>('@/services/leadService')
  return {
    ...actual,
    useUpdateLead: () => ({
      mutateAsync: vi.fn(),
      isPending: false
    }),
    useLead: () => ({ data: null })
  }
})

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

// Mock lead task templates and tasks hooks used by nested modals
vi.mock('@/hooks/useLeadTaskTemplates', () => ({
  useLeadTaskTemplates: () => ({ data: { data: [] }, isLoading: false })
}))

vi.mock('@/features/leads/hooks/useLeadTasks', () => ({
  useLeadTasks: () => ({ data: { data: [], next_action: null }, isLoading: false }),
  useCreateLeadTaskFromTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateLeadTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCompleteLeadTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSetTaskAsNextAction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteLeadTask: () => ({ mutate: vi.fn(), isPending: false })
}))

describe('LeadSalesRow', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <table>
          <tbody>{children}</tbody>
        </table>
      </QueryClientProvider>
    </MemoryRouter>
  )

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
      <LeadSalesRow
        {...baseLead}
        lastInteractionAt="invalid-date"
        lastInteractionType="email"
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Nenhuma interação')).toBeInTheDocument()
    expect(screen.queryByText(/há/)).toBeNull()
  })

  it('renders status badge with correct label', () => {
    render(<LeadSalesRow {...baseLead} />, { wrapper: Wrapper })

    expect(screen.getByText('Novo')).toBeInTheDocument()
  })

  it('renders "Sem status" when status is not provided', () => {
    render(<LeadSalesRow {...baseLead} status={undefined} />, { wrapper: Wrapper })

    expect(screen.getByText('Sem status')).toBeInTheDocument()
  })

  it('calls onScheduleClick when Agendar Reunião menu item is clicked', async () => {
    const onScheduleClick = vi.fn()
    const user = userEvent.setup()
    
    render(
      <LeadSalesRow {...baseLead} onScheduleClick={onScheduleClick} />,
      { wrapper: Wrapper }
    )

    // Find and click the actions menu trigger (kebab menu)
    const actionsMenuButton = screen.getByTestId('lead-actions-menu')
    expect(actionsMenuButton).toBeInTheDocument()
    
    await user.click(actionsMenuButton)
    
    // Wait for the dropdown to open and find the "Agendar Reunião" menu item
    const scheduleMenuItem = await screen.findByText('Agendar Reunião')
    expect(scheduleMenuItem).toBeInTheDocument()
    
    await user.click(scheduleMenuItem)

    expect(onScheduleClick).toHaveBeenCalledTimes(1)
    expect(onScheduleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'lead-1',
        legalName: 'Empresa Teste'
      })
    )
  })

  it('renders actions menu with all expected items', async () => {
    const user = userEvent.setup()
    
    render(
      <LeadSalesRow {...baseLead} />,
      { wrapper: Wrapper }
    )

    // Find and click the actions menu trigger (kebab menu)
    const actionsMenuButton = screen.getByTestId('lead-actions-menu')
    expect(actionsMenuButton).toBeInTheDocument()
    
    await user.click(actionsMenuButton)
    
    // Wait for the dropdown to open and verify all expected menu items are present using test ids
    expect(await screen.findByTestId('action-whatsapp')).toBeInTheDocument()
    expect(screen.getByTestId('action-email')).toBeInTheDocument()
    expect(screen.getByTestId('action-phone')).toBeInTheDocument()
    expect(screen.getByTestId('action-drive')).toBeInTheDocument()
    expect(screen.getByTestId('action-schedule')).toBeInTheDocument()
    expect(screen.getByTestId('action-copy-id')).toBeInTheDocument()
    expect(screen.getByTestId('action-details')).toBeInTheDocument()
  })

  it('renders nextAction.label correctly from backend', () => {
    render(
      <LeadSalesRow
        {...baseLead}
        nextAction={{ code: 'presentation', label: 'Apresentação' }}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Apresentação')).toBeInTheDocument()
  })

  it('renders "Sem próxima ação" fallback when nextAction is undefined', () => {
    render(<LeadSalesRow {...baseLead} nextAction={undefined} />, { wrapper: Wrapper })

    expect(screen.getByText('Sem próxima ação')).toBeInTheDocument()
  })

  it('renders nextAction with reason when provided', () => {
    render(
      <LeadSalesRow
        {...baseLead}
        nextAction={{
          code: 'follow_up',
          label: 'Follow-up',
          reason: 'Cliente solicitou mais informações'
        }}
      />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Follow-up')).toBeInTheDocument()
    expect(screen.getByText('Cliente solicitou mais informações')).toBeInTheDocument()
  })

  it('opens next action modal when Próxima ação cell is clicked', async () => {
    const user = userEvent.setup()

    render(
      <LeadSalesRow {...baseLead} />,
      { wrapper: Wrapper }
    )

    const cell = screen.getByTestId('next-action-cell')
    await user.click(cell)

    expect(await screen.findByText('Próxima ação')).toBeInTheDocument()
  })

  // Tags column tests
  it('does NOT render placeholder "Tags" badge when lead has no tags', () => {
    render(
      <LeadSalesRow {...baseLead} tags={[]} />,
      { wrapper: Wrapper }
    )

    // The "Tags" placeholder badge should NOT be present
    // Only check for exact text "Tags" as a standalone badge
    const tagsBadge = screen.queryByText((content, element) => {
      // Check if this is a badge-like element with exact text "Tags"
      return content === 'Tags' && element?.tagName === 'SPAN'
    })
    expect(tagsBadge).not.toBeInTheDocument()
  })

  it('renders tag badges when lead has tags', () => {
    const leadWithTags = {
      ...baseLead,
      tags: [
        { id: 'tag-1', name: 'Urgente', color: '#ff0000' },
        { id: 'tag-2', name: 'VIP', color: '#00ff00' }
      ]
    }

    render(
      <LeadSalesRow {...leadWithTags} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Urgente')).toBeInTheDocument()
    expect(screen.getByText('VIP')).toBeInTheDocument()
  })

  it('calls clipboard writeText when Copiar ID menu item is clicked', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    
    // Mock clipboard API using Object.defineProperty
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true
    })
    
    render(
      <LeadSalesRow {...baseLead} />,
      { wrapper: Wrapper }
    )

    // Open the actions menu
    const actionsMenuButton = screen.getByTestId('lead-actions-menu')
    await user.click(actionsMenuButton)
    
    // Click "Copiar ID"
    const copyIdMenuItem = await screen.findByTestId('action-copy-id')
    await user.click(copyIdMenuItem)
    
    expect(mockWriteText).toHaveBeenCalledWith('lead-1')
  })

  it('calls onClick when Detalhes menu item is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    
    render(
      <LeadSalesRow {...baseLead} onClick={onClick} />,
      { wrapper: Wrapper }
    )

    // Open the actions menu
    const actionsMenuButton = screen.getByTestId('lead-actions-menu')
    await user.click(actionsMenuButton)
    
    // Click "Detalhes"
    const detailsMenuItem = await screen.findByText('Detalhes')
    await user.click(detailsMenuItem)
    
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disables WhatsApp and Ligar menu items when phone is not available', async () => {
    const user = userEvent.setup()
    const leadWithoutPhone = {
      ...baseLead,
      primaryContact: { name: 'Contato sem telefone' }
    }
    
    render(
      <LeadSalesRow {...leadWithoutPhone} />,
      { wrapper: Wrapper }
    )

    // Open the actions menu
    const actionsMenuButton = screen.getByTestId('lead-actions-menu')
    await user.click(actionsMenuButton)
    
    // Find WhatsApp and Ligar items - they should be disabled (data-disabled attribute exists)
    const whatsappItem = await screen.findByTestId('action-whatsapp')
    const phoneItem = screen.getByTestId('action-phone')
    
    expect(whatsappItem).toHaveAttribute('data-disabled')
    expect(phoneItem).toHaveAttribute('data-disabled')
  })

  it('disables E-mail menu item when email is not available', async () => {
    const user = userEvent.setup()
    const leadWithoutEmail = {
      ...baseLead,
      primaryContact: { name: 'Contato sem email' }
    }
    
    render(
      <LeadSalesRow {...leadWithoutEmail} />,
      { wrapper: Wrapper }
    )

    // Open the actions menu
    const actionsMenuButton = screen.getByTestId('lead-actions-menu')
    await user.click(actionsMenuButton)
    
    // Find Email item - it should be disabled (data-disabled attribute exists)
    const emailItem = await screen.findByTestId('action-email')
    
    expect(emailItem).toHaveAttribute('data-disabled')
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
