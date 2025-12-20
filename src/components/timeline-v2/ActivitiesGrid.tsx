import { forwardRef } from 'react'
import { MessageSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { ActivityCard } from './ActivityCard'
import { cn } from '@/lib/utils'
import type { TimelineItem } from './types'

interface ActivitiesGridProps {
  items: TimelineItem[]
  isLoading: boolean
  currentUserId: string
  onEdit?: (item: TimelineItem) => void
  onDelete?: (item: TimelineItem) => void
  onReply?: (item: TimelineItem) => void
  className?: string
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const ActivitiesGrid = forwardRef<HTMLDivElement, ActivitiesGridProps>(
  function ActivitiesGrid(
    { items, isLoading, currentUserId, onEdit, onDelete, onReply, className },
    ref
  ) {
    if (isLoading) {
      return <LoadingSkeleton />
    }

    if (items.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title="Nenhuma atividade encontrada"
            description="Comece adicionando um comentário ou realize alguma ação."
          />
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full", className)}>
        {items.map((item) => (
          <div key={item.id} data-item-id={item.id} className="transition-all">
            <ActivityCard
              item={item}
              currentUserId={currentUserId}
              onEdit={onEdit ? () => onEdit(item) : undefined}
              onDelete={onDelete ? () => onDelete(item) : undefined}
              onReply={onReply ? () => onReply(item) : undefined}
              onEditReply={onEdit}
              onDeleteReply={onDelete}
            />
          </div>
        ))}
      </div>
    )
  }
)
