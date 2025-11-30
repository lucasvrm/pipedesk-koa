import { useTasks } from '@/services/taskService'
import { useTracks } from '@/services/trackService'
import { Task, PlayerStage } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Flag, Calendar, LinkSimple, Warning } from '@phosphor-icons/react'
import { formatDate } from '@/lib/helpers'
import { toast } from 'sonner'
import { useState } from 'react'
import CreateTaskDialog from '@/features/tasks/components/CreateTaskDialog'
import { useStages } from '@/services/pipelineService'

interface PlayerKanbanProps {
  playerTrackId: string
}

const DEFAULT_WIP_LIMIT = 5

export default function PlayerKanban({ playerTrackId }: PlayerKanbanProps) {
  const { data: tasks } = useTasks()
  const { data: playerTracks } = useTracks()
  const { data: stages = [] } = useStages()

  const [wipLimits, setWipLimits] = useState<Record<string, Record<string, number>>>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [editWipMode, setEditWipMode] = useState(false)

  const currentTrack = (playerTracks || []).find(t => t.id === playerTrackId)
  
  // Limites WIP por track
  const trackWipLimits = (wipLimits || {})[playerTrackId] || {}

  const trackTasks = (tasks || []).filter(t => t.playerTrackId === playerTrackId)

  // O "Task Stage" aqui é uma inferência baseada na ordem dos estágios do pipeline
  // Se a lógica anterior agrupava tarefas por fase do pipeline, precisamos saber a "fase" da tarefa.
  // Como Task não tem fase, assumiremos que tarefas incompletas seguem o estágio atual do Track?
  // Ou que este Kanban na verdade serve para visualizar tarefas AGRUPADAS pela fase em que o track estava?
  // Sem histórico de "em qual fase a tarefa foi criada", a lógica original parecia arbitraria ou baseada no índice.
  // Vou manter a lógica de distribuir tarefas nas colunas, mas como não temos metadados, 
  // assumiremos que todas as tarefas "pertencem" ao estágio atual para fins de Kanban se não houver lógica melhor.
  // CORREÇÃO: A lógica original `getTaskStage` parecia truncar tarefas em colunas futuras.
  // Vou simplificar para: Tarefas não têm estágio, então este Kanban é visualmente estranho se as colunas forem PipelineStages.
  // Mas para respeitar o pedido de "não quebrar", vou adaptar a lógica anterior usando os estágios dinâmicos.
  
  const getTaskStageId = (task: Task): string => {
    if (!currentTrack || stages.length === 0) return 'unknown'
    // Encontrar índice do estágio atual
    const currentStageIndex = stages.findIndex(s => s.id === currentTrack.currentStage)
    if (currentStageIndex === -1) return stages[0]?.id

    // Lógica original: tarefas ficam limitadas visualmente até o estágio atual
    // Como não podemos saber a qual estágio a tarefa "pertence", vamos colocá-las no estágio atual do Track
    return currentTrack.currentStage
  }

  // Filtrar tarefas por ID do estágio
  const tasksByStage = (stageId: string) => {
    // A lógica original era muito específica. Para um Kanban de Tarefas útil, 
    // normalmente queremos colunas "Todo", "Doing", "Done".
    // Se o usuário quer colunas baseadas nos Estágios do Pipeline, isso implica que tarefas são vinculadas a fases.
    // Como não são, vou renderizar as colunas do pipeline, mas as tarefas ficarão todas na coluna do estágio atual do track.
    if (!currentTrack) return []
    if (stageId === currentTrack.currentStage) {
        return trackTasks.filter(t => !t.completed)
    }
    return []
  }

  const completedTasks = trackTasks.filter(t => t.completed)

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetStageId: string) => {
    if (!draggedTask || !currentTrack) return
    // Como tasks não têm estágio, mover elas no Kanban de PipelineStages não faz sentido persistente.
    // Apenas emitimos o toast como na versão original.
    toast.error('Tarefas são vinculadas ao estágio atual do Player e não podem ser movidas entre fases retroativas/futuras manualmente.')
    setDraggedTask(null)
  }

  const updateWipLimit = (stageId: string, limit: number) => {
    const newLimits = {
      ...(wipLimits || {}),
      [playerTrackId]: {
        ...trackWipLimits,
        [stageId]: Math.max(1, limit),
      },
    }
    setWipLimits(newLimits)
  }

  if (stages.length === 0) return <div>Carregando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kanban de Tarefas (Por Fase)</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageTasks = tasksByStage(stage.id)
          const wipLimit = trackWipLimits[stage.id] || DEFAULT_WIP_LIMIT
          const isOverLimit = stageTasks.length > wipLimit
          const isNearLimit = stageTasks.length >= wipLimit * 0.8
          const isCurrentStage = currentTrack?.currentStage === stage.id

          return (
            <div
              key={stage.id}
              className={cn("flex flex-col gap-3 min-w-[200px]", !isCurrentStage && "opacity-50")}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="flex items-center justify-between px-2">
                <h4 className="font-semibold text-sm truncate" title={stage.name}>{stage.name}</h4>
                <div className="flex items-center gap-2">
                  {editWipMode ? (
                    <Input
                      type="number"
                      min="1"
                      value={wipLimit}
                      onChange={(e) => updateWipLimit(stage.id, parseInt(e.target.value))}
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

              <div className={`space-y-2 min-h-[200px] p-2 rounded-lg border ${isOverLimit
                  ? 'bg-destructive/5 border-destructive'
                  : draggedTask && stageTasks.length < wipLimit && isCurrentStage
                    ? 'bg-primary/5 border-primary border-dashed'
                    : 'bg-muted/30 border-dashed'
                }`}>
                {stageTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    {isCurrentStage ? "Nenhuma tarefa ativa" : "—"}
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
                                className={`text-[10px] px-1 py-0 h-5 gap-1 ${hasBlockingDeps ? 'border-destructive text-destructive' : ''
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