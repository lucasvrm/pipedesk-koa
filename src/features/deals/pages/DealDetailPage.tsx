import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDeal, useUpdateDeal } from '@/services/dealService'
import { useTracks, useUpdateTrack } from '@/services/trackService'
import { logActivity } from '@/services/activityService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { EntityDetailLayout } from '@/components/detail-layout/EntityDetailLayout'
import { KeyMetricsSidebar } from '@/components/detail-layout/KeyMetricsSidebar'
import { PipelineVisualizer } from '@/components/detail-layout/PipelineVisualizer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { STATUS_LABELS, OPERATION_LABELS, DealStatus } from '@/lib/types'
import { formatCurrency, formatDate, isOverdue } from '@/lib/helpers'
import { 
  Plus, Users, ChatCircle, ClockCounterClockwise, 
  FileText, Sparkle, Tag, PencilSimple,
  Kanban as KanbanIcon, List as ListIcon, Buildings,
  DotsThreeOutline, Wallet, CalendarBlank, WarningCircle,
  FileArrowDown, CheckCircle, PauseCircle, XCircle, PlayCircle,
  ChartBar, // Ícone AIDA
  CaretDown, // usado no botão "Alterar Status"
} from '@phosphor-icons/react'

import DealPlayersKanban from '../components/DealPlayersKanban' 
import { DroppedPlayersList } from '../components/DroppedPlayersList'
import CreatePlayerDialog from '../components/CreatePlayerDialog'
import { EditDealDialog } from '../components/EditDealDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'
import DocumentGenerator from '@/components/DocumentGenerator'
import AINextSteps from '@/components/AINextSteps'
import CustomFieldsRenderer from '@/components/CustomFieldsRenderer'
import { toast } from 'sonner'
import { PageContainer } from '@/components/PageContainer'

export default function DealDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()
  const { data: deal, isLoading } = useDeal(id || null)
  const { data: playerTracks } = useTracks()
  // No caso real, esses estágios viriam do banco (pipeline_stages).
  // Vou mockar aqui baseado na memória ou lógica existente, mas idealmente usaria `usePipelineStages`.
  // Como não quero adicionar chamadas novas que possam falhar, vou usar um set padrão robusto.
  const PIPELINE_STAGES = [
    { id: 'analysis', label: 'Análise' },
    { id: 'tease', label: 'Tease' },
    { id: 'offer', label: 'Oferta' },
    { id: 'diligence', label: 'Diligência' },
    { id: 'concluded', label: 'Concluído' }
  ]
  const updateDeal = useUpdateDeal()
  const updateTrack = useUpdateTrack()
  
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false)
  const [editDealOpen, setEditDealOpen] = useState(false)
  const [docGeneratorOpen, setDocGeneratorOpen] = useState(false)
  const [playersView, setPlayersView] = useState<'active' | 'dropped'>('active')

  const handleOpenAida = () => {
    if (!deal) {
      toast.error('Negócio não carregado. Tente novamente.')
      return
    }

    const projectId = deal.company?.id || deal.companyId

    if (!projectId) {
      toast.error('Vincule uma empresa ao negócio para abrir a Análise AIDA.')
      return
    }

    navigate(`/aida/${projectId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Negócio não encontrado</h2>
        <Button onClick={() => navigate('/deals')}>Voltar para Lista</Button>
      </div>
    )
  }

  const allDealTracks = (playerTracks || []).filter(t => t.masterDealId === deal.id)
  const activeTracks = allDealTracks.filter(t => t.status !== 'cancelled')
  const droppedTracks = allDealTracks.filter(t => t.status === 'cancelled')

  const handleStatusChange = (newStatus: DealStatus) => {
    if (newStatus === 'cancelled') {
      const activeTracksList = activeTracks.filter(t => t.status === 'active')
      activeTracksList.forEach(track => {
        updateTrack.mutate({
          trackId: track.id,
          updates: { status: 'cancelled' }
        })
      })
      updateDeal.mutate({
        dealId: deal.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => {
          toast.success('Negócio cancelado e players atualizados.')
          if (currentUser) logActivity(deal.id, 'deal', `Status alterado para ${STATUS_LABELS[newStatus]}`, currentUser.id)
        },
        onError: () => toast.error('Erro ao atualizar status')
      })
    } else {
      updateDeal.mutate({
        dealId: deal.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => {
          toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`)
          if (currentUser) logActivity(deal.id, 'deal', `Status alterado para ${STATUS_LABELS[newStatus]}`, currentUser.id)
        },
        onError: () => toast.error('Erro ao atualizar status')
      })
    }
  }

  const getStatusColor = (status: DealStatus) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'concluded': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'on_hold': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  const feeValue = deal.feePercentage && deal.volume ? (deal.volume * (deal.feePercentage / 100)) : 0;
  const feeDisplay = deal.feePercentage ? `${deal.feePercentage.toFixed(2).replace('.', ',')}%  |  ${formatCurrency(feeValue)}` : '—';
  
  const isDeadlineOverdue = deal.deadline ? isOverdue(deal.deadline.toString()) : false;
  const deadlineColorClass = isDeadlineOverdue ? 'border-l-red-500' : 'border-l-slate-400';
  const deadlineIconColor = isDeadlineOverdue ? 'text-red-500' : 'text-slate-500';

  const SIDEBAR_METRICS = [
    { label: 'Volume Total', value: formatCurrency(deal.volume), icon: <Wallet className="h-3 w-3" /> },
    { label: 'Fee Estimado', value: feeDisplay, icon: <Sparkle className="h-3 w-3" /> },
    { label: 'Prazo', value: formatDate(deal.deadline), icon: isDeadlineOverdue ? <WarningCircle className="h-3 w-3 text-red-500" /> : <CalendarBlank className="h-3 w-3" /> },
    { label: 'Players Ativos', value: activeTracks.filter(t => t.status === 'active').length, icon: <Users className="h-3 w-3" /> },
    { label: 'Empresa', value: deal.company ? deal.company.name : '—', icon: <Buildings className="h-3 w-3" /> }
  ]

  return (
    <EntityDetailLayout
      header={
        <PipelineVisualizer
          stages={PIPELINE_STAGES}
          currentStageId={deal.status}
          onStageClick={() => {}} // Deals don't change stage by clicking header usually, logic is complex
          readOnly
        />
      }
      sidebar={
        <KeyMetricsSidebar
          title={deal.clientName}
          subtitle={OPERATION_LABELS[deal.operationType]}
          statusBadge={
            <Badge className={`font-normal ${getStatusColor(deal.status)}`}>
              {STATUS_LABELS[deal.status]}
            </Badge>
          }
          metrics={SIDEBAR_METRICS}
          actions={
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="default" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleOpenAida}>
                  <ChartBar className="mr-2 h-4 w-4" /> AIDA
                </Button>
                <Button variant="outline" size="icon" onClick={() => setEditDealOpen(true)} title="Editar">
                  <PencilSimple className="h-4 w-4" />
                </Button>
              </div>

              {/* Status Actions Dropdown replacement */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Alterar Status <CaretDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuRadioGroup value={deal.status} onValueChange={(v) => handleStatusChange(v as DealStatus)}>
                    <DropdownMenuRadioItem value="active">Ativo</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="on_hold">Em Espera</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="concluded">Concluído</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="cancelled">Cancelado</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" onClick={() => setDocGeneratorOpen(true)} className="justify-start px-2">
                <FileArrowDown className="mr-2 h-4 w-4" /> Gerar Documento
              </Button>
            </div>
          }
        />
      }
      content={
        <Tabs defaultValue="players" className="w-full space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/40 border rounded-lg">
          <TabsTrigger value="players" className="py-2 px-4"><Users className="mr-2 h-4 w-4" /> Players</TabsTrigger>
          <TabsTrigger value="documents" className="py-2 px-4"><FileText className="mr-2 h-4 w-4" /> Docs</TabsTrigger>
          <TabsTrigger value="comments" className="py-2 px-4"><ChatCircle className="mr-2 h-4 w-4" /> Comentários</TabsTrigger>
          
          <TabsTrigger value="ai" disabled className="py-2 px-4 opacity-50 cursor-not-allowed"><Sparkle className="mr-2 h-4 w-4" /> IA</TabsTrigger>
          <TabsTrigger value="fields" disabled className="py-2 px-4 opacity-50 cursor-not-allowed"><Tag className="mr-2 h-4 w-4" /> Campos</TabsTrigger>
          <TabsTrigger value="activity" className="py-2 px-4"><ClockCounterClockwise className="mr-2 h-4 w-4" /> Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center bg-muted p-1 rounded-md gap-2">
              <Button 
                variant={playersView === 'active' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setPlayersView('active')}
              >
                <Sparkle className="mr-2 h-4 w-4" /> IA
              </TabsTrigger>
              <TabsTrigger
                value="fields"
                disabled
                className="py-2 px-4 opacity-50 cursor-not-allowed"
              >
                <Tag className="mr-2 h-4 w-4" /> Campos
              </TabsTrigger>
              <TabsTrigger value="activity" className="py-2 px-4">
                <ClockCounterClockwise className="mr-2 h-4 w-4" /> Atividades
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center bg-muted p-1 rounded-md gap-2">
                  <Button 
                    variant={playersView === 'active' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => setPlayersView('active')}
                  >
                    <KanbanIcon className="mr-2" />
                    Em Negociação ({activeTracks.length})
                  </Button>
                  <Button 
                    variant={playersView === 'dropped' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => setPlayersView('dropped')}
                  >
                    <ListIcon className="mr-2" />
                    Dropped ({droppedTracks.length})
                  </Button>
                </div>

                <Button onClick={() => setCreatePlayerOpen(true)} size="sm">
                  <Plus className="mr-2" /> Adicionar Player
                </Button>
              </div>
              
              {playersView === 'active' ? (
                activeTracks.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                    <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum player ativo.</p>
                    <Button variant="link" onClick={() => setCreatePlayerOpen(true)}>
                      Adicionar Primeiro Player
                    </Button>
                  </div>
                ) : (
                  <DealPlayersKanban tracks={activeTracks} currentUser={currentUser} />
                )
              ) : (
                <DroppedPlayersList tracks={droppedTracks} />
              )}
            </TabsContent>

            <TabsContent value="documents">
              {currentUser && (
                <DocumentManager 
                  entityId={deal.id} 
                  entityType="deal" 
                  currentUser={currentUser} 
                  entityName={deal.clientName} 
                />
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-6">
              {currentUser && (
                <CommentsPanel
                  entityId={deal.id}
                  entityType="deal"
                  currentUser={currentUser}
                />
              )}
            </TabsContent>

            <TabsContent value="ai">
              {currentUser && <AINextSteps dealId={deal.id} />}
            </TabsContent>

            <TabsContent value="fields">
              {currentUser && (
                <CustomFieldsRenderer
                  entityId={deal.id}
                  entityType="deal"
                  currentUser={currentUser}
                  mode="edit"
                />
              )}
            </TabsContent>

        <TabsContent value="activity">
          <ActivityHistory entityId={deal.id} entityType="deal" limit={50} />
        </TabsContent>
      </Tabs>
      }
    />

      <CreatePlayerDialog 
        masterDeal={deal} 
        open={createPlayerOpen} 
        onOpenChange={setCreatePlayerOpen} 
      />

      <EditDealDialog
        deal={deal}
        open={editDealOpen}
        onOpenChange={setEditDealOpen}
      />
    </PageContainer>
  )
}
