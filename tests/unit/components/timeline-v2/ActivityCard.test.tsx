import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityCard } from '@/components/timeline-v2/ActivityCard'
import type { TimelineItem } from '@/components/timeline-v2/types'

describe('ActivityCard', () => {
  const mockAuditItem: TimelineItem = {
    id: 'audit-1',
    type: 'audit',
    date: new Date().toISOString(),
    author: {
      id: 'user-1',
      name: 'John Doe',
      avatar: ''
    },
    content: 'Status alterado de Novo para Em Progresso',
    title: 'Alteração de status',
    isEditable: false,
    isDeletable: false
  }

  const mockCommentItem: TimelineItem = {
    id: 'comment-1',
    type: 'comment',
    date: new Date().toISOString(),
    author: {
      id: 'user-1',
      name: 'Jane Doe',
      avatar: ''
    },
    content: 'Este é um comentário de teste',
    isEditable: true,
    isDeletable: true
  }

  it('should render audit card with dark amber badge styles', () => {
    const { container } = render(
      <ActivityCard
        item={mockAuditItem}
        currentUserId="user-1"
        onReply={vi.fn()}
      />
    )

    // Find the badge element for the audit type
    const badge = screen.getByText('alteração')
    
    // Check that badge has the dark amber (amber-600) background with white text
    expect(badge.className).toContain('bg-amber-600')
    expect(badge.className).toContain('text-white')
    expect(badge.className).toContain('border-amber-700')
  })

  it('should render audit card with appropriate border color', () => {
    const { container } = render(
      <ActivityCard
        item={mockAuditItem}
        currentUserId="user-1"
        onReply={vi.fn()}
      />
    )

    // The main card container should have the amber border class
    const card = container.querySelector('.rounded-lg.border')
    expect(card?.className).toContain('border-amber-500')
  })

  it('should render comment card with yellow styles (not amber-600)', () => {
    const { container } = render(
      <ActivityCard
        item={mockCommentItem}
        currentUserId="user-1"
        onReply={vi.fn()}
      />
    )

    // Find the badge element for the comment type
    const badge = screen.getByText('comentário')
    
    // Comment badges should NOT have the dark amber style
    expect(badge.className).not.toContain('bg-amber-600')
    expect(badge.className).toContain('text-yellow-700')
  })

  it('should display author name', () => {
    render(
      <ActivityCard
        item={mockAuditItem}
        currentUserId="user-2"
        onReply={vi.fn()}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should display content', () => {
    render(
      <ActivityCard
        item={mockAuditItem}
        currentUserId="user-2"
        onReply={vi.fn()}
      />
    )

    expect(screen.getByText('Status alterado de Novo para Em Progresso')).toBeInTheDocument()
  })

  it('should display title when provided', () => {
    render(
      <ActivityCard
        item={mockAuditItem}
        currentUserId="user-2"
        onReply={vi.fn()}
      />
    )

    expect(screen.getByText('Alteração de status')).toBeInTheDocument()
  })

  it('should show Responder button', () => {
    render(
      <ActivityCard
        item={mockAuditItem}
        currentUserId="user-2"
        onReply={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Responder/i })).toBeInTheDocument()
  })

  it('should not show edit/delete menu for non-owner', () => {
    const { container } = render(
      <ActivityCard
        item={mockAuditItem}
        currentUserId="different-user"
        onReply={vi.fn()}
      />
    )

    // The dropdown menu trigger should not exist for non-owners
    const menuTrigger = container.querySelector('[data-testid="more-options"]')
    expect(menuTrigger).not.toBeInTheDocument()
  })
})
