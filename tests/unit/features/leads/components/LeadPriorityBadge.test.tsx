import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { LeadPriorityBadge } from '@/features/leads/components/LeadPriorityBadge'

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>
}))

describe('LeadPriorityBadge', () => {
  it('renders the correct label for each bucket', () => {
    render(
      <div className="flex gap-2">
        <LeadPriorityBadge priorityBucket="hot" />
        <LeadPriorityBadge priorityBucket="warm" />
        <LeadPriorityBadge priorityBucket="cold" />
      </div>
    )

    expect(screen.getByLabelText('Prioridade Alta')).toBeInTheDocument()
    expect(screen.getByLabelText('Prioridade Média')).toBeInTheDocument()
    expect(screen.getByLabelText('Prioridade Baixa')).toBeInTheDocument()
  })

  it('falls back to cold bucket when priority is undefined', () => {
    render(<LeadPriorityBadge priorityBucket={undefined} />)

    expect(screen.getByLabelText('Prioridade Baixa')).toBeInTheDocument()
  })

  it('shows score and description in the tooltip when provided', async () => {
    const user = userEvent.setup()
    render(<LeadPriorityBadge priorityBucket="hot" priorityScore={95} priorityDescription="Cliente estratégico" />)

    await user.hover(screen.getByLabelText('Prioridade Alta'))

    expect(await screen.findByText(/score: 95/i)).toBeInTheDocument()
    expect(await screen.findByText(/cliente estratégico/i)).toBeInTheDocument()
  })
})
