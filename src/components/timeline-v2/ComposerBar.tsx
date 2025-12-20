import { useState, useRef } from 'react'
import { Send, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimelineItem, CommentFormData, TimelineAuthor } from './types'

interface ComposerBarProps {
  onSubmit: (data: CommentFormData) => Promise<void>
  isSubmitting: boolean
  availableUsers: TimelineAuthor[]
  replyingTo?: TimelineItem | null
  onCancelReply?: () => void
}

export function ComposerBar({ onSubmit, isSubmitting, replyingTo, onCancelReply }: ComposerBarProps) {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const handleFocus = () => setIsExpanded(true)
  const handleBlur = () => { if (!content.trim() && !replyingTo) setIsExpanded(false) }
  const handleSubmit = async () => { if (!content.trim()) return; await onSubmit({ content, mentions: [], parentId: replyingTo?.id }); setContent('') }

  return (
    <div className="p-4 border-t bg-background transition-all duration-200">
      {replyingTo && (
        <div className="flex justify-between items-center mb-2 text-xs bg-muted/50 p-2 rounded">
          <span>Respondendo a <b>{replyingTo.author.name}</b></span>
          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onCancelReply}><X className="h-3 w-3" /></Button>
        </div>
      )}
      <div className={cn("flex gap-2", isExpanded ? "items-end" : "items-center")}>
        <Textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} placeholder="Escreva..." className={cn("resize-none transition-all", isExpanded ? "min-h-[80px]" : "min-h-[40px] h-[40px] py-2")} />
        {isExpanded && <Button onClick={handleSubmit} disabled={isSubmitting} size="icon"><Send className="h-4 w-4" /></Button>}
      </div>
    </div>
  )
}
