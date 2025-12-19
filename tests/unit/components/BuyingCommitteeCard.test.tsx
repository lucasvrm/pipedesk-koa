import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BuyingCommitteeCard } from '@/components/BuyingCommitteeCard'
import { Contact } from '@/lib/types'

describe('BuyingCommitteeCard', () => {
  const mockContact: Contact = {
    id: 'contact-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    role: 'Diretor de TI',
    linkedin: 'https://linkedin.com/in/joaosilva',
    companyId: null,
    isPrimary: true,
    createdAt: new Date().toISOString(),
    createdBy: 'user-1'
  }

  // Contact without email/linkedin to simplify tests
  const simpleContact: Contact = {
    ...mockContact,
    email: undefined,
    linkedin: undefined
  }

  it('renders contact information correctly', () => {
    render(<BuyingCommitteeCard contact={mockContact} />)

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Diretor de TI')).toBeInTheDocument()
    expect(screen.getByText('JS')).toBeInTheDocument() // initials
  })

  it('renders "Sem cargo" when role is not provided', () => {
    const contactWithoutRole = { ...mockContact, role: undefined }
    render(<BuyingCommitteeCard contact={contactWithoutRole} />)

    expect(screen.getByText('Sem cargo')).toBeInTheDocument()
  })

  describe('onClick prop', () => {
    it('card has role="button" attribute when onClick is provided', () => {
      const handleClick = vi.fn()
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} onClick={handleClick} />)

      // Get the root card element directly
      const card = container.querySelector('[role="button"]')
      expect(card).toBeInTheDocument()
    })

    it('card does NOT have role="button" attribute when onClick is not provided', () => {
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} />)

      // The card div should not have role="button"
      const card = container.querySelector('.rounded-lg.border')
      expect(card).not.toHaveAttribute('role')
    })

    it('card has tabIndex=0 when onClick is provided', () => {
      const handleClick = vi.fn()
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} onClick={handleClick} />)

      const card = container.querySelector('[role="button"]')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('card has cursor-pointer class when onClick is provided', () => {
      const handleClick = vi.fn()
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} onClick={handleClick} />)

      const card = container.querySelector('[role="button"]')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('calls onClick when card is clicked', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} onClick={handleClick} />)

      const card = container.querySelector('[role="button"]') as HTMLElement
      await user.click(card)

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(simpleContact)
    })

    it('calls onClick when Enter key is pressed', () => {
      const handleClick = vi.fn()
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} onClick={handleClick} />)

      const card = container.querySelector('[role="button"]') as HTMLElement
      fireEvent.keyDown(card, { key: 'Enter' })

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(simpleContact)
    })

    it('calls onClick when Space key is pressed', () => {
      const handleClick = vi.fn()
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} onClick={handleClick} />)

      const card = container.querySelector('[role="button"]') as HTMLElement
      fireEvent.keyDown(card, { key: ' ' })

      expect(handleClick).toHaveBeenCalledTimes(1)
      expect(handleClick).toHaveBeenCalledWith(simpleContact)
    })

    it('does NOT call onClick when other keys are pressed', () => {
      const handleClick = vi.fn()
      const { container } = render(<BuyingCommitteeCard contact={simpleContact} onClick={handleClick} />)

      const card = container.querySelector('[role="button"]') as HTMLElement
      fireEvent.keyDown(card, { key: 'Escape' })
      fireEvent.keyDown(card, { key: 'Tab' })

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('action buttons stopPropagation', () => {
    it('email button does NOT trigger card onClick', async () => {
      const handleClick = vi.fn()
      const mockOpen = vi.fn()
      const originalOpen = window.open
      window.open = mockOpen

      const user = userEvent.setup()
      const { container } = render(<BuyingCommitteeCard contact={mockContact} onClick={handleClick} />)

      // The email button is the first button inside the actions div
      const emailButton = container.querySelector('button[data-slot="button"]') as HTMLElement
      
      if (emailButton) {
        await user.click(emailButton)
      }

      // The card onClick should NOT have been called
      expect(handleClick).not.toHaveBeenCalled()
      
      window.open = originalOpen
    })
  })
})
