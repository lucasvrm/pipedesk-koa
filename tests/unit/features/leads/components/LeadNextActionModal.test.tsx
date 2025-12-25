import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach } from 'vitest'
import { LeadNextActionModal } from '@/features/leads/components/LeadNextActionModal'

const mutateAsyncMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/hooks/useLeadTaskTemplates', () => ({
  useLeadTaskTemplates: () => ({
    data: {
      data: [
        { id: 'tpl-1', label: 'Ligação', description: null, is_active: true, sort_order: 1, code: 'call', created_at: '' },
        { id: 'tpl-2', label: 'Enviar proposta', description: 'Compartilhar proposta', is_active: true, sort_order: 2, code: 'proposal', created_at: '' }
      ]
    },
    isLoading: false
  })
}))

vi.mock('@/features/leads/hooks/useLeadTasks', () => ({
  useLeadTasks: () => ({
    data: { data: [], next_action: null },
    isLoading: false
  }),
  useCreateLeadTaskFromTemplate: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false
  })
}))

describe('LeadNextActionModal', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  beforeEach(() => {
    mutateAsyncMock.mockClear()
  })

  it('selects an action and saves with is_next_action flag', async () => {
    const user = userEvent.setup()

    render(
      <QueryClientProvider client={queryClient}>
        <LeadNextActionModal open leadId="lead-1" onOpenChange={() => {}} />
      </QueryClientProvider>
    )

    const option = await screen.findByText('Ligação')
    await user.click(option)

    const saveButton = screen.getByRole('button', { name: /salvar/i })
    await user.click(saveButton)

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      template_id: 'tpl-1',
      is_next_action: true
    })
  })
})
