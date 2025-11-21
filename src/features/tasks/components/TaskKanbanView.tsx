import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Task, PlayerTrack, MasterDeal } from '@/lib/types'
import { CalendarBlank, User as UserIcon, Flag, LinkSimple } from '@phosphor-icons/react'
import { formatDate } from '@/lib/helpers'

interface TaskKanbanViewProps {
  tasks: Task[]
  onToggleComplete: (task: Task) => void
  onSelectTask: (task: Task) => void
  getTrackInfo: (trackId: string) => { track: PlayerTrack; deal: MasterDeal | undefined } | null
  getAssigneeNames: (assigneeIds: string[]) => string
  isTaskOverdue: (task: Task) => boolean
}

type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'completed'

export default function TaskKanbanView({
  tasks,
  onToggleComplete,
  onSelectTask,
  getTrackInfo,
  isTaskOverdue,
}: TaskKanbanViewProps) {
  const getTaskStatus = (task: Task): TaskStatus => {
    if (task.completed) return 'completed'
    
    const blockedBy = task.dependencies.filter(depId => {
      const depTask = tasks.find(t => t.id === depId)
      return depTask && !depTask.completed
    })
    
    if (blockedBy.length > 0) return 'blocked'
    
    if (task.assignees.length > 0) return 'in-progress'
    
    return 'todo'
  }

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'A Fazer', color: 'bg-muted' },
    { status: 'in-progress', label: 'Em Progresso', color: 'bg-primary/10' },
    { status: 'blocked', label: 'Bloqueadas', color: 'bg-destructive/10' },
    { status: 'completed', label: 'Concluídas', color: 'bg-success/10' },
  ]

  const tasksByStatus = columns.reduce((acc, col) => {
    acc[col.status] = tasks.filter(task => getTaskStatus(task) === col.status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  return (
    <div className="h-full p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {columns.map((column) => (
          <div key={column.status} className="flex flex-col min-h-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                {column.label}
                <Badge variant="secondary" className="font-normal">
                  {tasksByStatus[column.status].length}
                </Badge>
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4 pb-4">
                {tasksByStatus[column.status].map((task) => {
                  const trackInfo = getTrackInfo(task.playerTrackId)
                  const isOverdue = isTaskOverdue(task)

                  return (
                    <Card
                      key={task.id}
                      className="cursor-pointer transition-all hover:shadow-md"
                      onClick={() => onSelectTask(task)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => onToggleComplete(task)}
                              disabled={column.status === 'blocked'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              {task.isMilestone && (
                                <Flag className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                              )}
                              <h4
                                className={`text-sm font-medium ${
                                  task.completed ? 'line-through' : ''
                                }`}
                              >
                                {task.title}
                              </h4>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}
                            {trackInfo && (
                              <div className="text-xs text-muted-foreground mb-2">
                                {trackInfo.track.playerName}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {task.dueDate && (
                                <Badge
                                  variant={
                                    isOverdue && !task.completed
                                      ? 'destructive'
                                      : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  <CalendarBlank className="mr-1 h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </Badge>
                              )}
                              {task.assignees.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <UserIcon className="mr-1 h-3 w-3" />
                                  {task.assignees.length}
                                </Badge>
                              )}
                              {task.dependencies.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <LinkSimple className="mr-1 h-3 w-3" />
                                  {task.dependencies.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {tasksByStatus[column.status].length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhuma tarefa
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  )
}
