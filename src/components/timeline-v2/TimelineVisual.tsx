import { useState, useCallback, useRef, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TimelineHeader } from './TimelineHeader'
import { ActivitiesGrid } from './ActivitiesGrid'
import { ComposerBar } from './ComposerBar'
import { EditCommentModal } from './EditCommentModal'
import { DeleteCommentModal } from './DeleteCommentModal'
import { HorizontalTimeline } from './HorizontalTimeline'
import { useTimelineFilter } from './hooks/useTimelineFilter'
import { useTimelineMilestones } from './hooks/useTimelineMilestones'
import type {
  TimelineItem,
  TimelineAuthor,
  TimelineFilterState,
  CommentFormData
} from './types'

interface TimelineVisualProps {
  entityId: string
  entityType: 'lead' | 'deal' | 'company'
  items: TimelineItem[]
  isLoading?: boolean
  error?: Error | null
  onCreateComment: (data: CommentFormData) => Promise<void>
  onUpdateComment?: (commentId: string, content: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  currentUserId: string
  availableUsers: TimelineAuthor[]
  onRefetch?: () => void
  showHorizontalTimeline?: boolean
}

export function TimelineVisual({
  items,
  isLoading = false,
  error,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  currentUserId,
  availableUsers,
  onRefetch,
  showHorizontalTimeline = true
}: TimelineVisualProps) {
  const [filterState, setFilterState] = useState<TimelineFilterState>({
    searchQuery: '',
    activeTypes: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<TimelineItem | null>(null)
  
  // Estados para modais de edição e exclusão
  const [editingComment, setEditingComment] = useState<TimelineItem | null>(null)
  const [deletingComment, setDeletingComment] = useState<TimelineItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Ref for scrolling to cards
  const gridRef = useRef<HTMLDivElement>(null)

  const { filteredItems } = useTimelineFilter(items, filterState)
  const milestones = useTimelineMilestones(items)

  // Filter milestones based on current filter state
  const filteredMilestones = useMemo(() => {
    if (filterState.activeTypes.length === 0) {
      // Se nenhum filtro selecionado, mostrar todos exceto system
      return milestones.filter(m => m.type !== 'system')
    }
    return milestones.filter(m => filterState.activeTypes.includes(m.type))
  }, [milestones, filterState.activeTypes])

  const handleCreateComment = useCallback(
    async (data: CommentFormData) => {
      setIsSubmitting(true)
      try {
        await onCreateComment(data)
        setReplyingTo(null)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onCreateComment]
  )

  const handleEdit = useCallback(
    (item: TimelineItem) => {
      if (onUpdateComment) {
        setEditingComment(item)
      }
    },
    [onUpdateComment]
  )

  const handleDelete = useCallback(
    (item: TimelineItem) => {
      if (onDeleteComment) {
        setDeletingComment(item)
      }
    },
    [onDeleteComment]
  )

  // Handler para salvar edição de comentário
  const handleEditComment = useCallback(
    async (commentId: string, content: string) => {
      if (!onUpdateComment) return
      setIsUpdating(true)
      try {
        await onUpdateComment(commentId, content)
        toast.success('Comentário atualizado')
        setEditingComment(null)
        onRefetch?.()
      } catch (err) {
        console.error('Erro ao atualizar comentário:', err)
        toast.error('Erro ao atualizar comentário')
      } finally {
        setIsUpdating(false)
      }
    },
    [onUpdateComment, onRefetch]
  )

  // Handler para confirmar exclusão de comentário
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!onDeleteComment) return
      setIsDeleting(true)
      try {
        await onDeleteComment(commentId)
        toast.success('Comentário excluído')
        setDeletingComment(null)
        onRefetch?.()
      } catch (err) {
        console.error('Erro ao excluir comentário:', err)
        toast.error('Erro ao excluir comentário')
      } finally {
        setIsDeleting(false)
      }
    },
    [onDeleteComment, onRefetch]
  )

  const handleReply = useCallback((item: TimelineItem) => {
    setReplyingTo(item)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  // Handler for milestone click - scroll to the corresponding card
  const handleMilestoneClick = useCallback((milestoneId: string) => {
    if (!gridRef.current) return
    
    const cardElement = gridRef.current.querySelector(`[data-item-id="${milestoneId}"]`)
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add highlight effect
      cardElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
      setTimeout(() => {
        cardElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
      }, 2000)
    }
  }, [])

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-[600px] border rounded-lg bg-card">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-sm font-medium text-foreground mb-2">
            Erro ao carregar atividades
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Não foi possível carregar o histórico de atividades.
          </p>
          {onRefetch && (
            <Button variant="outline" size="sm" onClick={onRefetch}>
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card shadow-sm overflow-hidden">
      {/* Horizontal Timeline (milestones) */}
      {showHorizontalTimeline && filteredMilestones.length > 0 && (
        <div className="flex-shrink-0">
          <HorizontalTimeline
            milestones={filteredMilestones}
            onMilestoneClick={handleMilestoneClick}
          />
        </div>
      )}

      <div className="flex-shrink-0">
        <TimelineHeader
          filterState={filterState}
          onFilterChange={setFilterState}
          itemsCount={filteredItems.length}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ActivitiesGrid
          ref={gridRef}
          items={filteredItems}
          isLoading={isLoading}
          currentUserId={currentUserId}
          onEdit={onUpdateComment ? handleEdit : undefined}
          onDelete={onDeleteComment ? handleDelete : undefined}
          onReply={handleReply}
        />
      </div>

      <div className="flex-shrink-0 border-t bg-background">
        <ComposerBar
          onSubmit={handleCreateComment}
          isSubmitting={isSubmitting}
          availableUsers={availableUsers}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      </div>

      {/* Modais de edição e exclusão */}
      <EditCommentModal
        open={!!editingComment}
        onOpenChange={(open) => !open && setEditingComment(null)}
        comment={editingComment}
        onSave={handleEditComment}
        isSaving={isUpdating}
      />

      <DeleteCommentModal
        open={!!deletingComment}
        onOpenChange={(open) => !open && setDeletingComment(null)}
        comment={deletingComment}
        onConfirm={handleDeleteComment}
        isDeleting={isDeleting}
      />
    </div>
  )
}
