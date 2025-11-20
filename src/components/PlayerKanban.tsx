import { useKV } from '@github/spark/hooks'
import { Task, PlayerStage, STAGE_LABELS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Flag, Calendar, LinkSimple } from '@phosphor-icons/react'
import { formatDate } from '@/lib/helpers'
import { toast } from 'sonner'
import { useState } from 'react'
import CreateTaskDialog from './CreateTaskDialog'

interface PlayerKanbanProps {
  playerTrackId: string
}

const KANBAN_STAGES: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']

export default function PlayerKanban({ playerTrackId }: PlayerKanbanProps) {
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const trackTasks = (tasks || []).filter(t => t.playerTrackId === playerTrackId)

  const tasksByStage = (stageName: string) => {
    const stageIndex = KANBAN_STAGES.indexOf(stageName as PlayerStage)
    return trackTasks.filter(t => {
      const taskStageIndex = Math.min(
        stageIndex,
        t.completed ? KANBAN_STAGES.length - 1 : stageIndex
      )
      return taskStageIndex === stageIndex && !t.completed
    })
  }

  const completedTasks = trackTasks.filter(t => t.completed)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kanban de Tarefas</h3>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <Plus className="mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KANBAN_STAGES.map((stage) => {
          const stageTasks = tasksByStage(stage)

          return (
            <div key={stage} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <h4 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h4>
                <Badge variant="secondary" className="text-xs">
                  {stageTasks.length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[200px] p-2 bg-muted/30 rounded-lg border border-dashed">
                {stageTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Nenhuma tarefa
                  </div>
                ) : (
                  stageTasks.map((task) => {
                    const hasBlockingDeps = task.dependencies.some(
                      depId => tasks?.find(t => t.id === depId && !t.completed)
                    )

                    return (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3 space-y-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-tight line-clamp-2">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {task.isMilestone && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 gap-1 border-accent text-accent">
                                <Flag weight="fill" className="h-2.5 w-2.5" />
                                Marco
                              </Badge>
                            )}
                            {task.dependencies.length > 0 && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1 py-0 h-5 gap-1 ${
                                  hasBlockingDeps ? 'border-destructive text-destructive' : ''
                                }`}
                              >
                                <LinkSimple className="h-2.5 w-2.5" />
                                {task.dependencies.length}
                              </Badge>
                            )}
                          </div>

                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {completedTasks.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between px-2 mb-3">
            <h4 className="font-semibold text-sm text-success">Concluídas</h4>
            <Badge variant="outline" className="text-xs border-success text-success">
              {completedTasks.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {completedTasks.map((task) => (
              <Card key={task.id} className="opacity-60">
                <CardContent className="p-2">
                  <p className="text-xs font-medium line-clamp-1 line-through">
                    {task.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <CreateTaskDialog
        playerTrackId={playerTrackId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
