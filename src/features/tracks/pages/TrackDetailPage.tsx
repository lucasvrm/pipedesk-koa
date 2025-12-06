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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { 
  CheckSquare, ChatCircle, ClockCounterClockwise, 
  FileText, Buildings, CalendarBlank, Wallet, Percent, PresentationChart, PencilSimple,
  DotsThreeOutline
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
import { PageContainer } from '@/components/PageContainer'
import { renderNewBadge, renderUpdatedTodayBadge } from '@/components/ui/ActivityBadges'

export default function TrackDetailPage() {
  const { id } = useParams()
  const { profile: currentUser } = useAuth()
  
  // Data Fetching
  const { data: track, isLoading: trackLoading } = useTrack(id || null)
  const { data: deal } = useDeal(track?.masterDealId || null)
  const { data: tasks } = useTasks(id)
  const { data: users } = useUsers()
  const { data: stages = [], isLoading: stagesLoading } = useStages() // Hook Dinâmico
  
  const updateTrack = useUpdateTrack()
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

  // Helper de Cores
  const getStatusColor = (status: PlayerTrackStatus) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'concluded': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'on_hold': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  // Cálculo do Fee do Track
  const trackFee = deal?.feePercentage 
    ? (track.trackVolume * (deal.feePercentage / 100)) 
    : 0

  return (
    <PageContainer className="pb-24 space-y-6">
      
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/deals">Negócios</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {deal && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/deals/${deal.id}`}>{deal.clientName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{track.playerName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Link 
                to={`/players/${track.playerId}`} 
                className="hover:text-primary transition-colors"
                title="Ir para página do Player"
              >
                <h1 className="text-3xl font-bold tracking-tight hover:underline decoration-2 underline-offset-4">
                  {track.playerName}
                </h1>
              </Link>
              {renderNewBadge(track.createdAt)}
              {renderUpdatedTodayBadge(track.updatedAt)}
              <Badge className={`font-normal ${getStatusColor(track.status)}`}>
                {STATUS_LABELS[track.status]}
              </Badge>
            </div>

            {deal && (
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-sm font-medium">
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
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline">Fase Atual</span>
                    <Select value={track.currentStage} onValueChange={(v) => handleStageChange(v as PlayerStage)} disabled={stagesLoading}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Estágio" />
                        </SelectTrigger>
                        <SelectContent>
                            {stages.length === 0 ? (
                                <div className="p-2 text-center text-muted-foreground text-xs">Carregando estágios...</div>
                            ) : (
                                stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                    {stage.name}
                                </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Menu de Ações Secundárias */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <DotsThreeOutline weight="fill" className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações do Track</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditTrackOpen(true)}>
                            <PencilSimple className="mr-2 h-4 w-4" /> Editar Track
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border">
                <PresentationChart className="h-3.5 w-3.5" />
                <span>Probabilidade:</span>
                <span className="font-semibold text-foreground">{track.probability}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      <EditTrackDialog 
        track={track}
        open={editTrackOpen}
        onOpenChange={setEditTrackOpen}
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
    </PageContainer>
  )
}