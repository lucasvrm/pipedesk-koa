import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuyingCommitteeCard } from '@/components/BuyingCommitteeCard'
import { Contact, BuyingRole, ContactSentiment } from '@/lib/types'

// Mock the Tooltip components to simplify testing
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('BuyingCommitteeCard', () => {
  const mockContact: Contact = {
    id: 'contact-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    role: 'CTO',
    buyingRole: 'decision_maker' as BuyingRole,
    sentiment: 'positive' as ContactSentiment,
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders contact information correctly', () => {
    render(<BuyingCommitteeCard contact={mockContact} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('CTO')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<BuyingCommitteeCard contact={mockContact} onClick={handleClick} />)
    
    // Find the card by its role=button when onClick is provided
    const card = screen.getByRole('button', { name: /john doe/i })
    await user.click(card)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('has cursor-pointer class when onClick is provided', () => {
    const handleClick = vi.fn()
    render(<BuyingCommitteeCard contact={mockContact} onClick={handleClick} />)
    
    // The card wrapper should have cursor-pointer
    const cardWrapper = screen.getByRole('button', { name: /john doe/i })
    expect(cardWrapper).toHaveClass('cursor-pointer')
  })

  it('supports keyboard navigation (Enter and Space)', async () => {
    const handleClick = vi.fn()
    
    render(<BuyingCommitteeCard contact={mockContact} onClick={handleClick} />)
    
    const card = screen.getByRole('button', { name: /john doe/i })
    card.focus()
    
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    fireEvent.keyDown(card, { key: ' ' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('does not have role=button when onClick is not provided', () => {
    render(<BuyingCommitteeCard contact={mockContact} />)
    
    // The card should not have role=button, find it by the name instead
    const johnDoeText = screen.getByText('John Doe')
    expect(johnDoeText).toBeInTheDocument()
    
    // The parent container should not have role=button
    const card = johnDoeText.closest('div[role="button"]')
    expect(card).toBeNull()
  })
})

