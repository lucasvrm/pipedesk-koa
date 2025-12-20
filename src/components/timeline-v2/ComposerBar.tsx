import { useState, useCallback } from 'react'
import { Send, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
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
  replyingTo,
  onCancelReply
}: ComposerBarProps) {
  const [content, setContent] = useState('')

  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || isSubmitting) return

    await onSubmit({
      content: trimmedContent,
      mentions: [], // Mentions serão implementadas na Parte 2
      parentId: replyingTo?.id ?? null
    })

    setContent('')
  }, [content, isSubmitting, onSubmit, replyingTo?.id])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const isDisabled = !content.trim() || isSubmitting

  return (
    <div className="p-4 border-t bg-background">
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

      <div className="flex gap-2">
        <Textarea
          placeholder="Escreva um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
        Ctrl+Enter para enviar
      </p>
    </div>
  )
}
