import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTrack, useUpdateTrack } from '@/services/trackService'
import { useDeal } from '@/services/dealService'
import { useTasks, useUpdateTask } from '@/services/taskService'
import { useUsers } from '@/services/userService'
import { logActivity } from '@/services/activityService'
import { useAuth } from '@/contexts/AuthContext'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { 
  ArrowLeft, CheckSquare, ChatCircle, ClockCounterClockwise, 
  FileText, Buildings, CalendarBlank, Wallet, User as UserIcon
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import { DealStatus, STATUS_LABELS, Task, STAGE_LABELS, PlayerStage } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'

// Components
import TaskKanbanView from '@/features/tasks/components/TaskKanbanView'
import CreateTaskDialog from '@/features/tasks/components/CreateTaskDialog'
import TaskDetailDialog from '@/features/tasks/components/TaskDetailDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'

export default function TrackDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()
  
  // Data Fetching
  const { data: track, isLoading: trackLoading } = useTrack(id || null)
  const { data: deal } = useDeal(track?.masterDealId || null)
  const { data: tasks } = useTasks(id) // Fetch tasks for this track
  const { data: users } = useUsers()
  
  const updateTrack = useUpdateTrack()
  const updateTask = useUpdateTask()

  // UI States
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  if (trackLoading || !track) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // --- Handlers ---

  const handleStatusChange = (newStatus: DealStatus) => {
    updateTrack.mutate({
      trackId: track.id,
      updates: { status: newStatus }
    }, {
      onSuccess: () => {
        toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`)
        if (currentUser) logActivity(track.masterDealId, 'track', `Track de ${track.playerName} alterado para ${STATUS_LABELS[newStatus]}`, currentUser.id)
      },
      onError: () => toast.error('Erro ao atualizar status')
    })
  }

  const handleStageChange = (newStage: PlayerStage) => {
    updateTrack.mutate({
      trackId: track.id,
      updates: { currentStage: newStage }
    }, {
      onSuccess: () => {
        toast.success(`Estágio atualizado para ${STAGE_LABELS[newStage]}`)
        if (currentUser) logActivity(track.masterDealId, 'track', `Estágio alterado para ${STAGE_LABELS[newStage]}`, currentUser.id)
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

  // --- Helpers para o Kanban ---

  const getStatusColor = (status: DealStatus) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'concluded': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'on_hold': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

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

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => deal ? navigate(`/deals/${deal.id}`) : navigate('/deals')} 
          className="mb-4 pl-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para {deal ? deal.clientName : 'Negócios'}
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{track.playerName}</h1>
            </div>

            {deal && (
              <div className="flex items-center gap-1.5 text-muted-foreground mb-6 pl-0.5">
                <Buildings className="h-4 w-4" />
                <span className="font-medium text-sm">Deal: {deal.clientName}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 text-sm">
              <Badge className={`font-normal ${getStatusColor(track.status)}`}>
                {STATUS_LABELS[track.status]}
              </Badge>
              <Badge variant="outline" className="font-normal">
                {STAGE_LABELS[track.currentStage]}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            <Select value={track.currentStage} onValueChange={(v) => handleStageChange(v as PlayerStage)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estágio" />
              </SelectTrigger>
              <SelectContent>
                 {Object.entries(STAGE_LABELS).map(([key, label]) => (
                   <SelectItem key={key} value={key}>{label}</SelectItem>
                 ))}
              </SelectContent>
            </Select>

            <Select value={track.status} onValueChange={(v) => handleStatusChange(v as DealStatus)}>
              <SelectTrigger className={`w-[160px] border h-10 font-medium transition-colors ${getStatusColor(track.status)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="on_hold">Em Espera</SelectItem>
                <SelectItem value="concluded">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-blue-50 border-blue-200 shadow-sm p-3 flex flex-col justify-center gap-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Volume (Track)
          </span>
          <p className="text-lg font-bold text-blue-900 truncate" title={formatCurrency(track.trackVolume)}>
            {formatCurrency(track.trackVolume)}
          </p>
        </Card>

        <Card className="bg-card shadow-sm p-3 flex flex-col justify-center gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Probabilidade</span>
          <p className="text-sm font-bold text-foreground truncate">
            {track.probability}%
          </p>
        </Card>

        <Card className="bg-card shadow-sm p-3 flex flex-col justify-center gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <CalendarBlank className="h-3 w-3" /> Atualizado em
          </span>
          <p className="text-sm font-bold text-foreground truncate">
            {formatDate(track.updatedAt)}
          </p>
        </Card>

        <Card className="bg-amber-50 border-amber-200 shadow-sm p-3 flex flex-col justify-center gap-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <CheckSquare className="h-3 w-3" /> Tarefas Pendentes
          </span>
          <p className="text-lg font-bold text-amber-900">
            {tasks?.filter(t => !t.completed).length || 0}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
          <TabsTrigger value="tasks" className="py-2"><CheckSquare className="mr-2" /> Tarefas</TabsTrigger>
          <TabsTrigger value="documents" className="py-2"><FileText className="mr-2" /> Docs</TabsTrigger>
          <TabsTrigger value="comments" className="py-2"><ChatCircle className="mr-2" /> Comentários</TabsTrigger>
          <TabsTrigger value="activity" className="py-2"><ClockCounterClockwise className="mr-2" /> Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
               Gerencie o plano de ação para este player.
            </div>
            <Button onClick={() => setCreateTaskOpen(true)}>
              <CheckSquare className="mr-2" /> Nova Tarefa
            </Button>
          </div>
          
          <div className="h-[600px] border rounded-lg bg-slate-50/50">
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
  )
}