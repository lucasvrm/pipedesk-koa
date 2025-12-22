import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimelineHeader } from '@/components/timeline-v2/TimelineHeader'
import type { TimelineFilterState } from '@/components/timeline-v2/types'

describe('TimelineHeader', () => {
  const defaultFilterState: TimelineFilterState = {
    searchQuery: '',
    activeTypes: ['comment', 'email', 'meeting', 'audit', 'system']
  }

  const mockOnFilterChange = vi.fn()

  it('should render filter buttons', () => {
    render(
      <TimelineHeader
        filterState={defaultFilterState}
        onFilterChange={mockOnFilterChange}
        itemsCount={10}
      />
    )

    expect(screen.getByRole('button', { name: /Todos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Comentários/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Emails/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reuniões/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Alterações/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sistema/i })).toBeInTheDocument()
  })

  it('should apply dark amber background with white text to audit filter when active', () => {
    const filterState: TimelineFilterState = {
      searchQuery: '',
      activeTypes: ['audit']
    }

    render(
      <TimelineHeader
        filterState={filterState}
        onFilterChange={mockOnFilterChange}
        itemsCount={5}
      />
    )

    const auditButton = screen.getByRole('button', { name: /Alterações/i })
    
    // Check for dark amber (amber-600) background and white text classes
    expect(auditButton.className).toContain('bg-amber-600')
    expect(auditButton.className).toContain('text-white')
    expect(auditButton.className).toContain('border-amber-700')
  })

  it('should not apply amber styles to audit filter when inactive', () => {
    const filterState: TimelineFilterState = {
      searchQuery: '',
      activeTypes: ['comment'] // Only comment is active, not audit
    }

    render(
      <TimelineHeader
        filterState={filterState}
        onFilterChange={mockOnFilterChange}
        itemsCount={5}
      />
    )

    const auditButton = screen.getByRole('button', { name: /Alterações/i })
    
    // When inactive, should have default background styles, not amber-600
    expect(auditButton.className).not.toContain('bg-amber-600')
    expect(auditButton.className).toContain('bg-background')
  })

  it('should toggle audit filter on click', async () => {
    const user = userEvent.setup()
    const filterState: TimelineFilterState = {
      searchQuery: '',
      activeTypes: ['comment', 'email', 'meeting', 'audit', 'system']
    }

    render(
      <TimelineHeader
        filterState={filterState}
        onFilterChange={mockOnFilterChange}
        itemsCount={5}
      />
    )

    const auditButton = screen.getByRole('button', { name: /Alterações/i })
    await user.click(auditButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      searchQuery: '',
      activeTypes: ['comment', 'email', 'meeting', 'system'] // audit removed
    })
  })

  it('should display correct items count', () => {
    render(
      <TimelineHeader
        filterState={defaultFilterState}
        onFilterChange={mockOnFilterChange}
        itemsCount={42}
      />
    )

    expect(screen.getByText('42 itens')).toBeInTheDocument()
  })

  it('should use singular "item" for count of 1', () => {
    render(
      <TimelineHeader
        filterState={defaultFilterState}
        onFilterChange={mockOnFilterChange}
        itemsCount={1}
      />
    )

    expect(screen.getByText('1 item')).toBeInTheDocument()
  })
})
