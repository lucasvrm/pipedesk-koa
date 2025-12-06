import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '@/components/EmptyState'
import { Package } from '@phosphor-icons/react'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No items found"
        description="Get started by creating your first item"
      />
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating your first item')).toBeInTheDocument()
  })

  it('renders with optional description', () => {
    render(
      <EmptyState
        title="No items found"
      />
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders action button when provided (legacy API)', () => {
    const handleAction = vi.fn()
    
    render(
      <EmptyState
        title="No items"
        description="Create an item"
        actionLabel="Create Item"
        onAction={handleAction}
      />
    )

    expect(screen.getByRole('button', { name: /create item/i })).toBeInTheDocument()
  })

  it('renders primary action button when provided', async () => {
    const user = userEvent.setup()
    const handleAction = vi.fn()
    
    render(
      <EmptyState
        title="No items"
        description="Create an item"
        primaryAction={{ label: 'Create Item', onClick: handleAction }}
      />
    )

    const button = screen.getByRole('button', { name: /create item/i })
    expect(button).toBeInTheDocument()
    
    await user.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders both primary and secondary actions', () => {
    const handlePrimary = vi.fn()
    const handleSecondary = vi.fn()
    
    render(
      <EmptyState
        title="No items"
        description="Create an item"
        primaryAction={{ label: 'Create', onClick: handlePrimary }}
        secondaryAction={{ label: 'Learn More', onClick: handleSecondary }}
      />
    )

    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument()
  })

  it('does not render action buttons when not provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Create an item"
      />
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <EmptyState
        icon={<Package data-testid="empty-icon" size={48} />}
        title="No items"
        description="Create an item"
      />
    )

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
  })

  it('has dashed border styling', () => {
    const { container } = render(
      <EmptyState
        title="No items"
        description="Create an item"
      />
    )

    const emptyStateDiv = container.firstChild
    expect(emptyStateDiv).toHaveClass('border-dashed')
    expect(emptyStateDiv).toHaveClass('rounded-lg')
  })
})
