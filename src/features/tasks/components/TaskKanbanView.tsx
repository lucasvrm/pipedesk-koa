import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Task, PlayerTrack, MasterDeal } from '@/lib/types'
import { 
  CalendarBlank, User as UserIcon, Flag, LinkSimple, 
  CheckCircle, Warning, Clock, Users, XCircle, Archive, Kanban
} from '@phosphor-icons/react'
import { formatDate } from '@/lib/helpers'
import { cn } from '@/lib/utils'

interface TaskKanbanViewProps {
  tasks: Task[]
  onToggleComplete: (task: Task) => void
  onSelectTask: (task: Task) => void
  getTrackInfo: (trackId: string) => { track: PlayerTrack; deal: MasterDeal | undefined } | null
  getAssigneeNames: (assigneeIds: string[]) => string
  isTaskOverdue: (task: Task) => boolean
}

type TaskStatus = 'todo' | 'in_progress' | 'waiting_third_party' | 'blocked' | 'completed' | 'cancelled'

export default function TaskKanbanView({
  tasks,
  onToggleComplete,
  onSelectTask,
  getTrackInfo,
  isTaskOverdue,
}: TaskKanbanViewProps) {
  
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active')

  const getTaskStatus = (task: Task): TaskStatus => {
    // Adapter for legacy or different string formats
    if (task.status === 'in-progress' as any) return 'in_progress';
    if (task.status) return task.status

    if (task.completed) return 'completed'
    
    const blockedBy = task.dependencies.filter(depId => {
      const depTask = tasks.find(t => t.id === depId)
      return depTask && !depTask.completed
    })
    
    if (blockedBy.length > 0) return 'blocked'
    if (task.assignees.length > 0) return 'in_progress'
    
    return 'todo'
  }

  const activeColumns: { status: TaskStatus; label: string; color: string; icon: any }[] = [
    { status: 'todo', label: 'Pendentes', color: 'border-t-slate-400', icon: CheckCircle },
    { status: 'in_progress', label: 'Em Progresso', color: 'border-t-blue-500', icon: Clock },
    { status: 'waiting_third_party', label: 'Terceiros', color: 'border-t-purple-500', icon: Users },
    { status: 'blocked', label: 'Bloqueadas', color: 'border-t-red-500', icon: Warning },
  ]

  const archivedColumns: { status: TaskStatus; label: string; color: string; icon: any }[] = [
    { status: 'completed', label: 'Concluídas', color: 'border-t-emerald-500', icon: CheckCircle },
    { status: 'cancelled', label: 'Canceladas', color: 'border-t-slate-500', icon: XCircle },
  ]

  const currentColumns = viewMode === 'active' ? activeColumns : archivedColumns

  const tasksByStatus = currentColumns.reduce((acc, col) => {
    acc[col.status] = tasks.filter(task => getTaskStatus(task) === col.status)
    return acc
  }, {} as Record<TaskStatus, Task[]>)

  return (
    <div className="h-full p-4 flex flex-col gap-4">
      {/* Toggle de Visualização - ALINHADO À ESQUERDA (justify-start) */}
      <div className="flex justify-start">
        <div className="bg-muted p-1 rounded-lg flex gap-1">
          <Button
            variant={viewMode === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('active')}
            className="h-8 text-xs gap-2"
          >
            <Kanban size={14} />
            Em Andamento
          </Button>
          <Button
            variant={viewMode === 'archived' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('archived')}
            className="h-8 text-xs gap-2"
          >
            <Archive size={14} />
            Arquivadas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-0">
        {currentColumns.map((column) => (
          <div key={column.status} className="flex flex-col min-h-0 bg-muted/20 rounded-xl border border-border/50">
            <div className={cn("p-3 border-b bg-card/50 rounded-t-xl border-t-4 flex items-center justify-between", column.color)}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground/80">
                  {column.label}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-[20px] justify-center font-bold">
                {tasksByStatus[column.status].length}
              </Badge>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="space-y-3 pb-2">
                {tasksByStatus[column.status].map((task) => {
                  const isOverdue = isTaskOverdue(task)

                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-l-2 relative group",
                        task.completed ? "border-l-emerald-500 opacity-70 hover:opacity-100" : "border-l-primary",
                        isOverdue && !task.completed && "border-l-red-500 bg-red-50/10"
                      )}
                      onClick={() => onSelectTask(task)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => onToggleComplete(task)}
                              disabled={column.status === 'blocked'}
                              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start gap-2">
                              {task.isMilestone && (
                                <Flag weight="fill" className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              )}
                              <h4
                                className={cn(
                                  "text-sm font-medium leading-tight",
                                  task.completed && "line-through text-muted-foreground"
                                )}
                              >
                                {task.title}
                              </h4>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                              {task.dueDate && (
                                <div className={cn(
                                  "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border",
                                  isOverdue && !task.completed 
                                    ? "bg-red-100 text-red-700 border-red-200" 
                                    : "bg-muted text-muted-foreground border-border"
                                )}>
                                  <CalendarBlank className="h-3 w-3" />
                                  <span>{formatDate(task.dueDate)}</span>
                                </div>
                              )}
                              
                              {task.assignees.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-100">
                                  <UserIcon className="h-3 w-3" />
                                  <span>{task.assignees.length}</span>
                                </div>
                              )}

                              {task.dependencies.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-100">
                                  <LinkSimple className="h-3 w-3" />
                                  <span>{task.dependencies.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                {tasksByStatus[column.status].length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                    <div className="p-3 bg-muted rounded-full mb-2">
                        <column.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Vazio</span>
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
