import { useState, useMemo, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TimelineHeader } from './TimelineHeader'
import { ActivitiesGrid } from './ActivitiesGrid'
import { ComposerBar } from './ComposerBar'
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
}

// Hook inline for filter logic
function useTimelineFilter(items: TimelineItem[], filterState: TimelineFilterState) {
  return useMemo(() => {
    let filtered = [...items]

    // Filter by type
    if (filterState.activeFilter !== 'all') {
      if (filterState.activeFilter === 'comment') {
        filtered = filtered.filter((item) => item.type === 'comment')
      } else if (filterState.activeFilter === 'communication') {
        filtered = filtered.filter(
          (item) => item.type === 'email' || item.type === 'meeting'
        )
      } else if (filterState.activeFilter === 'system') {
        filtered = filtered.filter(
          (item) => item.type === 'audit' || item.type === 'system'
        )
      }
    }

    // Filter by search query
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.content.toLowerCase().includes(query) ||
          item.title?.toLowerCase().includes(query) ||
          item.author.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [items, filterState])
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
  onRefetch
}: TimelineVisualProps) {
  const [filterState, setFilterState] = useState<TimelineFilterState>({
    searchQuery: '',
    activeFilter: 'all'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<TimelineItem | null>(null)

  const filteredItems = useTimelineFilter(items, filterState)

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
        // Placeholder - será implementado na Parte 2
        console.log('Edit item:', item.id)
      }
    },
    [onUpdateComment]
  )

  const handleDelete = useCallback(
    (item: TimelineItem) => {
      if (onDeleteComment) {
        // Placeholder - será implementado na Parte 2
        console.log('Delete item:', item.id)
      }
    },
    [onDeleteComment]
  )

  const handleReply = useCallback((item: TimelineItem) => {
    // Placeholder - será implementado na Parte 3
    setReplyingTo(item)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
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
    <div className="flex flex-col h-[600px] border rounded-lg bg-card shadow-sm">
      <TimelineHeader
        filterState={filterState}
        onFilterChange={setFilterState}
        itemsCount={filteredItems.length}
      />

      <ActivitiesGrid
        items={filteredItems}
        isLoading={isLoading}
        currentUserId={currentUserId}
        onEdit={onUpdateComment ? handleEdit : undefined}
        onDelete={onDeleteComment ? handleDelete : undefined}
        onReply={handleReply}
      />

      <ComposerBar
        onSubmit={handleCreateComment}
        isSubmitting={isSubmitting}
        availableUsers={availableUsers}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  )
}
