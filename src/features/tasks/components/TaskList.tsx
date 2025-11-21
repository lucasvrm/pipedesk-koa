import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Plus, Trash, CheckCircle, Flag, LinkSimple, Calendar } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Task } from '@/lib/types'
import { formatDate } from '@/lib/helpers'
import { toast } from 'sonner'
import CreateTaskDialog from './CreateTaskDialog'

interface TaskListProps {
  playerTrackId: string
}

export default function TaskList({ playerTrackId }: TaskListProps) {
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const trackTasks = (tasks || [])
    .filter(t => t.playerTrackId === playerTrackId)
    .sort((a, b) => a.position - b.position)

  const handleToggleComplete = (task: Task) => {
    const blockedBy = task.dependencies
      .map(depId => tasks?.find(t => t.id === depId))
      .filter((t): t is Task => !!t && !t.completed)

    if (blockedBy.length > 0 && !task.completed) {
      toast.error('Tarefa bloqueada por dependências não concluídas')
      return
    }

    setTasks((currentTasks) =>
      (currentTasks || []).map(t =>
        t.id === task.id
          ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
          : t
      )
    )

    if (!task.completed && task.isMilestone) {
      toast.success('🎉 Marco concluído!', {
        description: task.title,
      })
    }
  }

  const handleDeleteTask = (taskId: string) => {
    const dependents = (tasks || []).filter(t => t.dependencies.includes(taskId))
    
    if (dependents.length > 0) {
      toast.error('Não é possível excluir tarefa com dependentes')
      return
    }

    setTasks((currentTasks) => (currentTasks || []).filter(t => t.id !== taskId))
    toast.success('Tarefa excluída')
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setCreateDialogOpen(true)
  }

  const getBlockedByTasks = (task: Task): Task[] => {
    return task.dependencies
      .map(depId => tasks?.find(t => t.id === depId))
      .filter((t): t is Task => !!t && !t.completed)
  }

  const isTaskBlocked = (task: Task): boolean => {
    return getBlockedByTasks(task).length > 0
  }

  if (trackTasks.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
        <div className="space-y-3">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">Nenhuma tarefa ainda</p>
            <p className="text-sm text-muted-foreground">
              Comece adicionando tarefas para este player
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2" />
            Adicionar Tarefa
          </Button>
        </div>
        <CreateTaskDialog
          playerTrackId={playerTrackId}
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open)
            if (!open) setEditingTask(null)
          }}
          editingTask={editingTask}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Tarefas</h3>
          <p className="text-sm text-muted-foreground">
            {trackTasks.filter(t => t.completed).length} de {trackTasks.length} concluídas
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <div className="space-y-2">
        {trackTasks.map((task) => {
          const blocked = isTaskBlocked(task)
          const blockedByTasks = getBlockedByTasks(task)

          return (
            <div
              key={task.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg border bg-card
                ${task.completed ? 'opacity-60' : ''}
                ${blocked && !task.completed ? 'border-destructive/30 bg-destructive/5' : ''}
                transition-all hover:shadow-sm
              `}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task)}
                          disabled={blocked}
                          className="mt-1"
                        />
                      </div>
                    </TooltipTrigger>
                    {blocked && (
                      <TooltipContent>
                        <p className="text-xs">Bloqueada por:</p>
                        {blockedByTasks.map(t => (
                          <p key={t.id} className="text-xs font-medium">• {t.title}</p>
                        ))}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                      onClick={() => !task.completed && handleEditTask(task)}
                      role="button"
                    >
                      {task.title}
                    </p>
                    {task.isMilestone && (
                      <Badge variant="outline" className="gap-1 border-accent text-accent">
                        <Flag weight="fill" className="h-3 w-3" />
                        Marco
                      </Badge>
                    )}
                    {task.dependencies.length > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <LinkSimple className="h-3 w-3" />
                        {task.dependencies.length}
                      </Badge>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                    {task.assignees.length > 0 && (
                      <div>Responsáveis: {task.assignees.length}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditTask(task)}
                  className="h-8 w-8"
                >
                  <LinkSimple className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(task.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <CreateTaskDialog
        playerTrackId={playerTrackId}
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) setEditingTask(null)
        }}
        editingTask={editingTask}
      />
    </div>
  )
}
