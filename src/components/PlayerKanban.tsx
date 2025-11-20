import { useKV } from '@github/spark/hooks'
import { Task, PlayerStage, STAGE_LABELS, PlayerTrack } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Flag, Calendar, LinkSimple, Warning } from '@phosphor-icons/react'
import { formatDate } from '@/lib/helpers'
import { toast } from 'sonner'
import { useState, useRef } from 'react'
import { CreateTaskDialog } from '@/features/tasks'

interface PlayerKanbanProps {
  playerTrackId: string
}

const KANBAN_STAGES: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']

const DEFAULT_WIP_LIMITS: Record<PlayerStage, number> = {
  nda: 5,
  analysis: 4,
  proposal: 3,
  negotiation: 3,
  closing: 2,
}

export default function PlayerKanban({ playerTrackId }: PlayerKanbanProps) {
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [wipLimits, setWipLimits] = useKV<Record<string, Record<PlayerStage, number>>>('kanbanWipLimits', {})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [editWipMode, setEditWipMode] = useState(false)
  
  const currentTrack = (playerTracks || []).find(t => t.id === playerTrackId)
  const trackWipLimits = (wipLimits || {})[playerTrackId] || DEFAULT_WIP_LIMITS

  const trackTasks = (tasks || []).filter(t => t.playerTrackId === playerTrackId)

  const getTaskStage = (task: Task): PlayerStage => {
    if (!currentTrack) return 'nda'
    const currentStageIndex = KANBAN_STAGES.indexOf(currentTrack.currentStage)
    return KANBAN_STAGES[Math.min(currentStageIndex, KANBAN_STAGES.length - 1)]
  }

  const tasksByStage = (stageName: PlayerStage) => {
    return trackTasks.filter(t => !t.completed && getTaskStage(t) === stageName)
  }

  const completedTasks = trackTasks.filter(t => t.completed)

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetStage: PlayerStage) => {
    if (!draggedTask || !currentTrack) return

    const targetTasks = tasksByStage(targetStage)
    const wipLimit = trackWipLimits[targetStage]
    
    if (targetTasks.length >= wipLimit && getTaskStage(draggedTask) !== targetStage) {
      toast.error(`Limite WIP atingido para ${STAGE_LABELS[targetStage]} (${wipLimit} tarefas)`)
      setDraggedTask(null)
      return
    }

    const targetStageIndex = KANBAN_STAGES.indexOf(targetStage)
    const currentStageIndex = KANBAN_STAGES.indexOf(currentTrack.currentStage)

    if (targetStageIndex > currentStageIndex) {
      toast.error('Não é possível mover tarefas para estágios futuros')
      setDraggedTask(null)
      return
    }

    toast.success(`Tarefa movida para ${STAGE_LABELS[targetStage]}`)
    setDraggedTask(null)
  }

  const updateWipLimit = (stage: PlayerStage, limit: number) => {
    const newLimits = {
      ...(wipLimits || {}),
      [playerTrackId]: {
        ...trackWipLimits,
        [stage]: Math.max(1, limit),
      },
    }
    setWipLimits(newLimits)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kanban de Tarefas</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={editWipMode ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setEditWipMode(!editWipMode)}
          >
            <Warning className="mr-2" />
            {editWipMode ? 'Salvar Limites' : 'Limites WIP'}
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KANBAN_STAGES.map((stage) => {
          const stageTasks = tasksByStage(stage)
          const wipLimit = trackWipLimits[stage]
          const isOverLimit = stageTasks.length > wipLimit
          const isNearLimit = stageTasks.length >= wipLimit * 0.8

          return (
            <div 
              key={stage} 
              className="flex flex-col gap-3"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              <div className="flex items-center justify-between px-2">
                <h4 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h4>
                <div className="flex items-center gap-2">
                  {editWipMode ? (
                    <Input
                      type="number"
                      min="1"
                      value={wipLimit}
                      onChange={(e) => updateWipLimit(stage, parseInt(e.target.value))}
                      className="w-12 h-6 text-xs text-center p-1"
                    />
                  ) : (
                    <Badge 
                      variant={isOverLimit ? 'destructive' : isNearLimit ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {stageTasks.length}/{wipLimit}
                    </Badge>
                  )}
                </div>
              </div>

              <div className={`space-y-2 min-h-[200px] p-2 rounded-lg border ${
                isOverLimit 
                  ? 'bg-destructive/5 border-destructive' 
                  : draggedTask && stageTasks.length < wipLimit
                  ? 'bg-primary/5 border-primary border-dashed' 
                  : 'bg-muted/30 border-dashed'
              }`}>
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
                      <Card 
                        key={task.id} 
                        className="cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={() => handleDragStart(task)}
                      >
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
