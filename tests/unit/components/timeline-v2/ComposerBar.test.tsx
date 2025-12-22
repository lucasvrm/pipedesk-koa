import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComposerBar } from '@/components/timeline-v2/ComposerBar'
import type { TimelineItem, TimelineAuthor } from '@/components/timeline-v2/types'

// Mock ResizeObserver
class ResizeObserverMock {
  callback: ResizeObserverCallback
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  
  observe(target: Element) {
    // Immediately call with mock entry
    this.callback([
      {
        target,
        borderBoxSize: [{ blockSize: 100, inlineSize: 500 }],
        contentBoxSize: [{ blockSize: 80, inlineSize: 480 }],
        contentRect: { width: 480, height: 80, top: 0, left: 0, bottom: 80, right: 480, x: 0, y: 0, toJSON: () => ({}) },
        devicePixelContentBoxSize: [{ blockSize: 80, inlineSize: 480 }]
      }
    ] as ResizeObserverEntry[], this)
  }
  
  unobserve() {}
  disconnect() {}
}

describe('ComposerBar', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined)
  const mockOnCancelReply = vi.fn()
  const mockOnHeightChange = vi.fn()
  
  const mockAvailableUsers: TimelineAuthor[] = [
    { id: 'user-1', name: 'John Doe', avatar: '' },
    { id: 'user-2', name: 'Jane Smith', avatar: '' }
  ]

  const mockReplyingTo: TimelineItem = {
    id: 'item-1',
    type: 'comment',
    date: new Date().toISOString(),
    author: { id: 'user-2', name: 'Jane Smith', avatar: '' },
    content: 'Original comment'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render textarea in minimized state by default', () => {
    render(
      <ComposerBar
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        availableUsers={mockAvailableUsers}
      />
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    expect(textarea).toBeInTheDocument()
    
    // Should not show the expanded helper text
    expect(screen.queryByText(/Ctrl\+Enter para enviar/i)).not.toBeInTheDocument()
  })

  it('should expand when textarea is focused', async () => {
    const user = userEvent.setup()
    
    render(
      <ComposerBar
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        availableUsers={mockAvailableUsers}
      />
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    await user.click(textarea)

    // Should now show the expanded helper text
    await waitFor(() => {
      expect(screen.getByText(/Ctrl\+Enter para enviar/i)).toBeInTheDocument()
    })
  })

  it('should minimize when focus leaves and no content is typed', async () => {
    const user = userEvent.setup()
    
    const { container } = render(
      <div>
        <button data-testid="outside-element">Outside</button>
        <ComposerBar
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          availableUsers={mockAvailableUsers}
        />
      </div>
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    const outsideElement = screen.getByTestId('outside-element')
    
    // Focus the textarea to expand
    await user.click(textarea)
    
    // Verify it's expanded
    await waitFor(() => {
      expect(screen.getByText(/Ctrl\+Enter para enviar/i)).toBeInTheDocument()
    })

    // Click outside to blur
    await user.click(outsideElement)

    // Should minimize (helper text should disappear)
    await waitFor(() => {
      expect(screen.queryByText(/Ctrl\+Enter para enviar/i)).not.toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should auto-expand when replyingTo is set', async () => {
    render(
      <ComposerBar
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        availableUsers={mockAvailableUsers}
        replyingTo={mockReplyingTo}
        onCancelReply={mockOnCancelReply}
      />
    )

    // With replyingTo, it should auto-expand
    await waitFor(() => {
      expect(screen.getByText(/Ctrl\+Enter para enviar/i)).toBeInTheDocument()
    })

    // The replying indicator should be shown
    expect(screen.getByText(/Respondendo a/i)).toBeInTheDocument()
  })

  it('should NOT minimize when content is typed and focus leaves', async () => {
    const user = userEvent.setup()
    
    render(
      <div>
        <button data-testid="outside-element">Outside</button>
        <ComposerBar
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          availableUsers={mockAvailableUsers}
        />
      </div>
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    
    // Focus and type
    await user.click(textarea)
    await user.type(textarea, 'Some content')
    
    // Click outside
    const outsideElement = screen.getByTestId('outside-element')
    await user.click(outsideElement)

    // Should NOT minimize because content is present
    await waitFor(() => {
      expect(screen.getByText(/Ctrl\+Enter para enviar/i)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should display replying indicator when replyingTo is set', () => {
    render(
      <ComposerBar
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        availableUsers={mockAvailableUsers}
        replyingTo={mockReplyingTo}
        onCancelReply={mockOnCancelReply}
      />
    )

    expect(screen.getByText(/Respondendo a/i)).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should call onHeightChange when height changes', async () => {
    render(
      <ComposerBar
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        availableUsers={mockAvailableUsers}
        onHeightChange={mockOnHeightChange}
      />
    )

    // onHeightChange should have been called (initial height report)
    await waitFor(() => {
      expect(mockOnHeightChange).toHaveBeenCalled()
    })
  })

  it('should submit comment on Ctrl+Enter', async () => {
    const user = userEvent.setup()
    
    render(
      <ComposerBar
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        availableUsers={mockAvailableUsers}
      />
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    
    await user.click(textarea)
    await user.type(textarea, 'Test comment')
    await user.keyboard('{Control>}{Enter}{/Control}')

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        content: 'Test comment',
        mentions: [],
        parentId: null
      })
    })
  })

  it('should disable textarea when submitting', () => {
    render(
      <ComposerBar
        onSubmit={mockOnSubmit}
        isSubmitting={true}
        availableUsers={mockAvailableUsers}
      />
    )

    const textarea = screen.getByPlaceholderText('Escreva um comentário...')
    expect(textarea).toBeDisabled()
  })
})
