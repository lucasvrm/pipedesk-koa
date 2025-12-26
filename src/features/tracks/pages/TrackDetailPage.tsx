import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTrack, useUpdateTrack } from '@/services/trackService'
import { useDeal } from '@/services/dealService'
import { useTasks, useUpdateTask } from '@/services/taskService'
import { useUsers } from '@/services/userService'
import { useStages } from '@/services/pipelineService' // NOVO: Importa o hook dinâmico
import { logActivity } from '@/services/activityService'
import { useAuth } from '@/contexts/AuthContext'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { trackStatusMap } from '@/lib/statusMaps'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { 
  CheckSquare, ChatCircle, ClockCounterClockwise, 
  FileText, Buildings, CalendarBlank, Wallet, Percent, PresentationChart, PencilSimple
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import { STATUS_LABELS, Task, PlayerStage, PlayerTrackStatus } from '@/lib/types' // REMOVIDO: STAGE_LABELS
import { formatCurrency, formatDate } from '@/lib/helpers'

// Components
import TaskKanbanView from '@/features/tasks/components/TaskKanbanView'
import CreateTaskDialog from '@/features/tasks/components/CreateTaskDialog'
import TaskDetailDialog from '@/features/tasks/components/TaskDetailDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'
import { EditTrackDialog } from '../components/EditTrackDialog'
import { StandardPageLayout } from '@/components/layouts'
import { renderNewBadge, renderUpdatedTodayBadge } from '@/components/ui/ActivityBadges'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getTrackQuickActions } from '@/hooks/useQuickActions'
import { useNavigate } from 'react-router-dom'
import { useDeleteTrack } from '@/services/trackService'

export default function TrackDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()
  
  // Data Fetching
  const { data: track, isLoading: trackLoading } = useTrack(id || null)
  const { data: deal } = useDeal(track?.masterDealId || null)
  const { data: tasks } = useTasks(id)
  const { data: users } = useUsers()
  const { data: stages = [], isLoading: stagesLoading } = useStages() // Hook Dinâmico
  
  const updateTrack = useUpdateTrack()
  const deleteTrack = useDeleteTrack()
  const updateTask = useUpdateTask()

  // UI States
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [editTrackOpen, setEditTrackOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Memo para obter o nome do estágio a partir dos dados dinâmicos
  const stageMap = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = stage.name;
      return acc;
    }, {} as Record<string, string>);
  }, [stages]);
  
  if (trackLoading || !track || stagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // --- Handlers ---

  const handleStageChange = (newStageId: PlayerStage) => {
    // Encontra o estágio para obter a probabilidade dinâmica
    const stageInfo = stages.find(s => s.id === newStageId);

    updateTrack.mutate({
      trackId: track.id,
      updates: { 
        currentStage: newStageId,
        probability: stageInfo?.probability || 0, // Atualiza probabilidade
      }
    }, {
      onSuccess: () => {
        const stageName = stageMap[newStageId] || newStageId;
        toast.success(`Estágio atualizado para ${stageName}`)
        if (currentUser) logActivity(track.masterDealId, 'track', `Estágio alterado para ${stageName}`, currentUser.id)
      },
      onError: () => toast.error('Erro ao atualizar estágio')
    })
  }

  const handleToggleTaskComplete = (task: Task) => {
    updateTask.mutate({
      taskId: task.id,
      updates: { completed: !task.completed }
    }, {
      onSuccess: () => toast.success(task.completed ? 'Tarefa reaberta' : 'Tarefa concluída'),
      onError: () => toast.error('Erro ao atualizar tarefa')
    })
  }

  // --- Helpers ---

  const getTrackInfo = (trackId: string) => {
    if (track && track.id === trackId) {
       return { track, deal }
    }
    return null
  }

  const getAssigneeNames = (assigneeIds: string[]) => {
    if (!users) return ''
    return users
      .filter(u => assigneeIds.includes(u.id))
      .map(u => u.name)
      .join(', ')
  }
  
  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(task.dueDate) < today
  }

  // Cálculo do Fee do Track
  const trackFee = deal?.feePercentage 
    ? (track.trackVolume * (deal.feePercentage / 100)) 
    : 0

  return (
    <StandardPageLayout>
      {/* Content */}
      <div className="space-y-6">
        {deal && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Buildings className="h-4 w-4" />
            <Link 
              to={`/deals/${deal.id}`}
              className="hover:text-primary hover:underline transition-colors"
            >
              {deal.clientName}
            </Link>
            {deal.company?.name && (
              <>
                <span className="opacity-50 mx-1">|</span>
                <Link 
                  to={`/companies/${deal.company.id}`}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {deal.company.name}
                </Link>
              </>
            )}
          </div>
        )}

        {/* Cards de Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Volume */}
        <Card className="p-4 flex flex-col justify-between gap-1 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-blue-500" /> Volume (Track)
          </span>
          <p className="text-xl font-bold text-foreground truncate" title={formatCurrency(track.trackVolume)}>
            {formatCurrency(track.trackVolume)}
          </p>
        </Card>

        {/* Card 2: Fee */}
        <Card className="p-4 flex flex-col justify-between gap-1 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-emerald-500" /> Fee Estimado
          </span>
          <div className="flex flex-col">
            <p className="text-xl font-bold text-foreground truncate" title={formatCurrency(trackFee)}>
                {formatCurrency(trackFee)}
            </p>
            {deal?.feePercentage && (
                <span className="text-[10px] text-muted-foreground">Base: {deal.feePercentage}% do Deal</span>
            )}
          </div>
        </Card>

        {/* Card 3: Tarefas */}
        <Card className="p-4 flex flex-col justify-between gap-1 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="h-3.5 w-3.5 text-amber-500" /> Tarefas Pendentes
          </span>
          <p className="text-xl font-bold text-foreground">
            {tasks?.filter(t => !t.completed).length || 0}
          </p>
        </Card>

        {/* Card 4: Atualizado em */}
        <Card className="p-4 flex flex-col justify-between gap-1 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CalendarBlank className="h-3.5 w-3.5 text-purple-500" /> Atualizado em
          </span>
          <p className="text-sm font-medium text-foreground truncate mt-1">
            {formatDate(track.updatedAt)}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/40 border rounded-lg">
          <TabsTrigger value="tasks" className="py-2 px-4"><CheckSquare className="mr-2 h-4 w-4" /> Tarefas</TabsTrigger>
          <TabsTrigger value="documents" className="py-2 px-4"><FileText className="mr-2 h-4 w-4" /> Docs</TabsTrigger>
          <TabsTrigger value="comments" className="py-2 px-4"><ChatCircle className="mr-2 h-4 w-4" /> Comentários</TabsTrigger>
          <TabsTrigger value="activity" className="py-2 px-4"><ClockCounterClockwise className="mr-2 h-4 w-4" /> Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center bg-card p-3 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <CheckSquare weight="fill" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">Plano de Ação</h3>
                    <p className="text-xs text-muted-foreground">Gerencie o plano de ação deste Track</p>
                </div>
            </div>
            <Button onClick={() => setCreateTaskOpen(true)} size="sm">
              <CheckSquare className="mr-2" /> Nova Tarefa
            </Button>
          </div>
          
          <div className="min-h-[600px] border rounded-xl bg-muted/10 p-1">
             <TaskKanbanView 
                tasks={tasks || []}
                onToggleComplete={handleToggleTaskComplete}
                onSelectTask={setSelectedTask}
                getTrackInfo={getTrackInfo}
                getAssigneeNames={getAssigneeNames}
                isTaskOverdue={isTaskOverdue}
             />
          </div>
        </TabsContent>

        <TabsContent value="documents">
          {currentUser && (
            <DocumentManager 
              entityId={track.id} 
              entityType="track" 
              currentUser={currentUser} 
              entityName={`${track.playerName} - ${deal?.clientName}`} 
            />
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          {currentUser && <CommentsPanel entityId={track.id} entityType="track" currentUser={currentUser} />}
        </TabsContent>

        <TabsContent value="activity">
          <ActivityHistory entityId={track.id} entityType="track" limit={50} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTaskDialog 
        playerTrackId={track.id}
        open={createTaskOpen} 
        onOpenChange={setCreateTaskOpen} 
            />

      {selectedTask && currentUser && (
        <TaskDetailDialog
            task={selectedTask}
            open={!!selectedTask}
            onOpenChange={(open) => !open && setSelectedTask(null)}
            onToggleComplete={handleToggleTaskComplete}
            currentUser={currentUser}
        />
      )}
      </div>
    </StandardPageLayout>
  )
}