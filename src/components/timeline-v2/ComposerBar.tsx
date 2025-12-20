import { useState, useCallback, useRef } from 'react'
import { Send, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MentionsDropdown } from './MentionsDropdown'
import type { TimelineItem, CommentFormData, TimelineAuthor } from './types'

interface ComposerBarProps {
  onSubmit: (data: CommentFormData) => Promise<void>
  isSubmitting: boolean
  availableUsers: TimelineAuthor[]
  replyingTo?: TimelineItem | null
  onCancelReply?: () => void
}

export function ComposerBar({
  onSubmit,
  isSubmitting,
  availableUsers,
  replyingTo,
  onCancelReply
}: ComposerBarProps) {
  const [content, setContent] = useState('')
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [showMentions, setShowMentions] = useState(false)
  const [selectedMentions, setSelectedMentions] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate dropdown position based on textarea cursor
  const calculateMentionPosition = useCallback(() => {
    if (!textareaRef.current || !containerRef.current) return { top: 0, left: 0 }
    
    const textarea = textareaRef.current
    const containerRect = containerRef.current.getBoundingClientRect()
    const textareaRect = textarea.getBoundingClientRect()
    
    // Position dropdown above the textarea
    return {
      top: textareaRect.top - containerRect.top - 10,
      left: 8
    }
  }, [])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)
    
    // Detect @mention
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1])
      setMentionPosition(calculateMentionPosition())
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }, [calculateMentionPosition])

  const handleSelectMention = useCallback((user: TimelineAuthor) => {
    if (!textareaRef.current) return
    
    const cursorPos = textareaRef.current.selectionStart || 0
    const textBeforeCursor = content.slice(0, cursorPos)
    const textAfterCursor = content.slice(cursorPos)
    
    // Replace @query with @name
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${user.name} `)
    const newContent = newTextBefore + textAfterCursor
    
    setContent(newContent)
    setSelectedMentions(prev => 
      prev.includes(user.id) ? prev : [...prev, user.id]
    )
    setShowMentions(false)
    setMentionSearch('')
    
    // Focus back on textarea
    textareaRef.current?.focus()
  }, [content])

  const handleCloseMentions = useCallback(() => {
    setShowMentions(false)
    setMentionSearch('')
  }, [])

  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || isSubmitting) return

    await onSubmit({
      content: trimmedContent,
      mentions: selectedMentions,
      parentId: replyingTo?.id ?? null
    })

    setContent('')
    setSelectedMentions([])
  }, [content, isSubmitting, onSubmit, replyingTo?.id, selectedMentions])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Don't handle Enter if mentions dropdown is open (handled by dropdown)
      if (showMentions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
        return
      }
      
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit, showMentions]
  )

  const isDisabled = !content.trim() || isSubmitting

  return (
    <div ref={containerRef} className="relative p-4 border-t bg-background">
      {/* Replying indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-muted/50 rounded-md text-xs text-muted-foreground">
          <span>
            Respondendo a <strong className="text-foreground">{replyingTo.author.name}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Mentions dropdown */}
      <MentionsDropdown
        users={availableUsers}
        searchQuery={mentionSearch}
        onSelect={handleSelectMention}
        position={mentionPosition}
        isOpen={showMentions}
        onClose={handleCloseMentions}
      />

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Escreva um comentário... Use @ para mencionar"
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] resize-none text-sm"
          disabled={isSubmitting}
        />
        <div className="flex flex-col justify-end">
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="h-9 w-9"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
        Ctrl+Enter para enviar · @ para mencionar
      </p>
    </div>
  )
}
