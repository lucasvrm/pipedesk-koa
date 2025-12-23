import { Check, Star, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LeadTask } from '@/services/leadTasksService'

interface LeadTaskItemProps {
  task: LeadTask
  onComplete: () => void
  onSetNextAction: () => void
  onDelete: () => void
  isCompletePending?: boolean
  isSetNextActionPending?: boolean
}

export function LeadTaskItem({
  task,
  onComplete,
  onSetNextAction,
  onDelete,
  isCompletePending,
  isSetNextActionPending,
}: LeadTaskItemProps) {
  const isCompleted = task.status === 'completed'
  const isPending = task.status === 'pending' || task.status === 'in_progress'

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        task.is_next_action && 'border-primary bg-primary/5',
        isCompleted && 'opacity-50'
      )}
    >
      {/* Indicador de próxima ação */}
      <div className="w-5">
        {task.is_next_action && (
          <Star className="h-4 w-4 text-primary fill-primary" />
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className={cn('font-medium', isCompleted && 'line-through')}>
          {task.title}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">
            {task.description}
          </p>
        )}
        {task.template_code && (
          <code className="text-xs text-muted-foreground bg-muted px-1 rounded">
            {task.template_code}
          </code>
        )}
      </div>

      {/* Ações */}
      {isPending && (
        <div className="flex items-center gap-1">
          {!task.is_next_action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSetNextAction}
              disabled={isSetNextActionPending}
              title="Definir como próxima ação"
            >
              {isSetNextActionPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            disabled={isCompletePending}
            title="Marcar como concluída"
          >
            {isCompletePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Remover"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}

      {isCompleted && (
        <span className="text-xs text-muted-foreground">Concluída</span>
      )}
    </div>
  )
}
