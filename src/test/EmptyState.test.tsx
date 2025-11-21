import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('renders action button when provided', () => {
    const handleAction = () => {}
    
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

  it('does not render action button when not provided', () => {
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
})
