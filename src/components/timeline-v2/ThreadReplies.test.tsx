import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThreadReplies } from './ThreadReplies'
import type { TimelineItem } from './types'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <div>ChevronDown</div>,
  ChevronUp: () => <div>ChevronUp</div>,
  MoreVertical: () => <div>MoreVertical</div>,
  Edit: () => <div>Edit</div>,
  Trash2: () => <div>Trash2</div>,
  Reply: () => <div>Reply</div>
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'há 2 minutos'
}))

describe('ThreadReplies - Nested Replies', () => {
  const mockAuthor = {
    id: 'user1',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
  }

  const currentUserId = 'user1'

  const createMockReply = (id: string, depth: number = 0): TimelineItem => ({
    id,
    type: 'comment',
    author: mockAuthor,
    content: `Reply ${id}`,
    date: new Date().toISOString(),
    depth,
    isEditable: true,
    isDeletable: true,
    replies: []
  })

  describe('Depth limits', () => {
    it('should show reply button at depth 1', () => {
      const replies = [createMockReply('reply1', 1)]
      const onReply = vi.fn()

      render(
        <ThreadReplies
          replies={replies}
          currentUserId={currentUserId}
          onReply={onReply}
          depth={1}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /responder/i })
      expect(replyButtons.length).toBeGreaterThan(0)
    })

    it('should show reply button at depth 2', () => {
      const replies = [createMockReply('reply1', 2)]
      const onReply = vi.fn()

      render(
        <ThreadReplies
          replies={replies}
          currentUserId={currentUserId}
          onReply={onReply}
          depth={2}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /responder/i })
      expect(replyButtons.length).toBeGreaterThan(0)
    })

    it('should show reply button at depth 3', () => {
      const replies = [createMockReply('reply1', 3)]
      const onReply = vi.fn()

      render(
        <ThreadReplies
          replies={replies}
          currentUserId={currentUserId}
          onReply={onReply}
          depth={3}
        />
      )

      const replyButtons = screen.getAllByRole('button', { name: /responder/i })
      expect(replyButtons.length).toBeGreaterThan(0)
    })

    it('should NOT show reply button at depth 4 (max depth)', () => {
      const replies = [createMockReply('reply1', 4)]
      const onReply = vi.fn()

      render(
        <ThreadReplies
          replies={replies}
          currentUserId={currentUserId}
          onReply={onReply}
          depth={4}
        />
      )

      const replyButtons = screen.queryAllByRole('button', { name: /responder/i })
      expect(replyButtons).toHaveLength(0)
    })
  })

  describe('Nested rendering', () => {
    it('should render nested replies recursively', () => {
      const nestedReplies: TimelineItem[] = [
        {
          ...createMockReply('reply1', 1),
          replies: [
            {
              ...createMockReply('reply1-1', 2),
              replies: [
                createMockReply('reply1-1-1', 3)
              ]
            }
          ]
        }
      ]

      render(
        <ThreadReplies
          replies={nestedReplies}
          currentUserId={currentUserId}
          depth={1}
        />
      )

      // Should find all three replies in the tree
      expect(screen.getByText('Reply reply1')).toBeInTheDocument()
      expect(screen.getByText('Reply reply1-1')).toBeInTheDocument()
      expect(screen.getByText('Reply reply1-1-1')).toBeInTheDocument()
    })
  })

  describe('Reply callback', () => {
    it('should call onReply with correct reply item', async () => {
      const replies = [createMockReply('reply1', 1)]
      const onReply = vi.fn()

      const { getByRole } = render(
        <ThreadReplies
          replies={replies}
          currentUserId={currentUserId}
          onReply={onReply}
          depth={1}
        />
      )

      const replyButton = getByRole('button', { name: /responder/i })
      replyButton.click()

      expect(onReply).toHaveBeenCalledTimes(1)
      expect(onReply).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'reply1',
          content: 'Reply reply1'
        })
      )
    })
  })
})
