import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityCard } from './ActivityCard'
import type { TimelineItem } from './types'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MessageSquare: () => <div>MessageSquare</div>,
  Mail: () => <div>Mail</div>,
  Calendar: () => <div>Calendar</div>,
  GitCommit: () => <div>GitCommit</div>,
  Zap: () => <div>Zap</div>,
  MoreVertical: () => <div>MoreVertical</div>,
  Reply: () => <div>Reply</div>,
  Edit: () => <div>Edit</div>,
  Trash2: () => <div>Trash2</div>
}))

describe('ActivityCard - Reply Button Visibility', () => {
  const mockAuthor = {
    id: 'user1',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
  }

  const currentUserId = 'user1'

  const createMockItem = (type: TimelineItem['type']): TimelineItem => ({
    id: `item-${type}`,
    type,
    author: mockAuthor,
    content: `This is a ${type} item`,
    date: new Date().toISOString(),
    isEditable: true,
    isDeletable: true
  })

  describe('Reply button should ONLY show for comments', () => {
    it('should show reply button for comment items', () => {
      const commentItem = createMockItem('comment')
      const onReply = vi.fn()

      render(
        <ActivityCard
          item={commentItem}
          currentUserId={currentUserId}
          onReply={onReply}
        />
      )

      const replyButton = screen.getByRole('button', { name: /responder/i })
      expect(replyButton).toBeInTheDocument()
    })

    it('should NOT show reply button for email items', () => {
      const emailItem = createMockItem('email')

      render(
        <ActivityCard
          item={emailItem}
          currentUserId={currentUserId}
        />
      )

      const replyButton = screen.queryByRole('button', { name: /responder/i })
      expect(replyButton).not.toBeInTheDocument()
    })

    it('should NOT show reply button for meeting items', () => {
      const meetingItem = createMockItem('meeting')

      render(
        <ActivityCard
          item={meetingItem}
          currentUserId={currentUserId}
        />
      )

      const replyButton = screen.queryByRole('button', { name: /responder/i })
      expect(replyButton).not.toBeInTheDocument()
    })

    it('should NOT show reply button for audit items', () => {
      const auditItem = createMockItem('audit')

      render(
        <ActivityCard
          item={auditItem}
          currentUserId={currentUserId}
        />
      )

      const replyButton = screen.queryByRole('button', { name: /responder/i })
      expect(replyButton).not.toBeInTheDocument()
    })

    it('should NOT show reply button for system items', () => {
      const systemItem = createMockItem('system')

      render(
        <ActivityCard
          item={systemItem}
          currentUserId={currentUserId}
        />
      )

      const replyButton = screen.queryByRole('button', { name: /responder/i })
      expect(replyButton).not.toBeInTheDocument()
    })
  })

  describe('Reply button functionality', () => {
    it('should call onReply when clicked on comment', async () => {
      const user = userEvent.setup()
      const commentItem = createMockItem('comment')
      const onReply = vi.fn()

      render(
        <ActivityCard
          item={commentItem}
          currentUserId={currentUserId}
          onReply={onReply}
        />
      )

      const replyButton = screen.getByRole('button', { name: /responder/i })
      await user.click(replyButton)

      expect(onReply).toHaveBeenCalledTimes(1)
    })

    it('should show reply count when comment has replies', () => {
      const commentItem: TimelineItem = {
        ...createMockItem('comment'),
        replies: [
          createMockItem('comment'),
          createMockItem('comment')
        ]
      }

      render(
        <ActivityCard
          item={commentItem}
          currentUserId={currentUserId}
          onReply={vi.fn()}
        />
      )

      expect(screen.getByText('(2)')).toBeInTheDocument()
    })

    it('should not show reply count when comment has no replies', () => {
      const commentItem = createMockItem('comment')

      render(
        <ActivityCard
          item={commentItem}
          currentUserId={currentUserId}
          onReply={vi.fn()}
        />
      )

      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
    })
  })

  describe('Edit and Delete menu visibility', () => {
    it('should show edit/delete menu for own comments', () => {
      const commentItem = createMockItem('comment')

      render(
        <ActivityCard
          item={commentItem}
          currentUserId={currentUserId}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Should have a button to open the dropdown menu
      const menuButton = screen.getByRole('button', { name: '' }) // MoreVertical icon button
      expect(menuButton).toBeInTheDocument()
    })

    it('should NOT show edit/delete menu for others comments', () => {
      const commentItem: TimelineItem = {
        ...createMockItem('comment'),
        author: {
          id: 'user2', // Different user
          name: 'Jane Doe'
        }
      }

      render(
        <ActivityCard
          item={commentItem}
          currentUserId={currentUserId}
        />
      )

      // Should not have menu button for non-owner
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(1) // Only reply button
    })
  })

  describe('Type badge rendering', () => {
    it('should render correct badge for each item type', () => {
      const types: TimelineItem['type'][] = ['comment', 'email', 'meeting', 'audit', 'system']

      types.forEach(type => {
        const { unmount } = render(
          <ActivityCard
            item={createMockItem(type)}
            currentUserId={currentUserId}
          />
        )

        // Badge should be present (checking by type label)
        const expectedLabels: Record<typeof type, string> = {
          comment: 'comentário',
          email: 'email',
          meeting: 'reunião',
          audit: 'alteração',
          system: 'sistema'
        }

        expect(screen.getByText(expectedLabels[type])).toBeInTheDocument()
        unmount()
      })
    })
  })
})
