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
  ChartBar // Ícone AIDA
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

  return (
    <PageContainer className="pb-24">

      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/deals">Negócios</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{deal.clientName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{deal.clientName}</h1>
              <Badge className={`font-normal ${getStatusColor(deal.status)}`}>
                {STATUS_LABELS[deal.status]}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              {deal.company && (
                <div className="flex items-center gap-1.5 pl-0.5">
                  <Buildings className="h-4 w-4" />
                  <Link 
                    to={`/companies/${deal.company.id}`}
                    className="font-medium hover:text-primary hover:underline transition-colors"
                  >
                    {deal.company.name}
                  </Link>
                  <span className="opacity-50 mx-1">|</span>
                </div>
              )}
              <span className="font-medium">{OPERATION_LABELS[deal.operationType]}</span>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            
            {/* BOTÃO AIDA */}
            <Button
              variant="secondary"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 border"
              onClick={handleOpenAida}
            >
              <ChartBar className="mr-2 h-4 w-4" />
              Análise AIDA
            </Button>

            {/* IMPORTANTE: O DocumentGenerator fica FORA do DropdownMenu */}
            <DocumentGenerator 
              deal={deal} 
              playerTracks={activeTracks} 
              open={docGeneratorOpen} 
              onOpenChange={setDocGeneratorOpen} 
            />

            {/* Menu de Ações (3 Pontinhos) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 data-[state=open]:bg-muted">
                  <DotsThreeOutline weight="fill" className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Ações do Negócio</DropdownMenuLabel>
                
                <DropdownMenuItem onClick={() => setEditDealOpen(true)}>
                  <PencilSimple className="mr-2 h-4 w-4" /> Editar Informações
                </DropdownMenuItem>

                {/* Usamos onSelect para garantir o fechamento limpo do menu antes de abrir o modal */}
                <DropdownMenuItem onSelect={() => setDocGeneratorOpen(true)}>
                  <FileArrowDown className="mr-2 h-4 w-4" /> Gerar Documento
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                {/* Submenu de Status */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    {deal.status === 'active' && <PlayCircle className="mr-2 h-4 w-4 text-green-600" />}
                    {deal.status === 'on_hold' && <PauseCircle className="mr-2 h-4 w-4 text-amber-600" />}
                    {deal.status === 'concluded' && <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />}
                    {deal.status === 'cancelled' && <XCircle className="mr-2 h-4 w-4 text-red-600" />}
                    <span>Alterar Status</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0">
                    <DropdownMenuRadioGroup value={deal.status} onValueChange={(v) => handleStatusChange(v as DealStatus)}>
                      <DropdownMenuRadioItem value="active" className="cursor-pointer">
                        <PlayCircle className="mr-2 h-4 w-4 text-green-500" /> Ativo
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="on_hold" className="cursor-pointer">
                        <PauseCircle className="mr-2 h-4 w-4 text-amber-500" /> Em Espera
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="concluded" className="cursor-pointer">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" /> Concluído
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="cancelled" className="cursor-pointer">
                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> Cancelado
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Cards de Métricas (Padronizados) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Volume (Azul) */}
        <Card className="p-4 flex flex-col justify-between gap-1 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-blue-500" /> Volume Total
          </span>
          <p className="text-xl font-bold text-foreground truncate" title={formatCurrency(deal.volume)}>
            {formatCurrency(deal.volume)}
          </p>
        </Card>

        {/* Card 2: Fee Estimado (Emerald/Verde) */}
        <Card className="p-4 flex flex-col justify-between gap-1 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkle className="h-3.5 w-3.5 text-emerald-500" /> Fee Estimado
          </span>
          <p className="text-sm font-bold text-foreground truncate" title={feeDisplay}>
            {feeDisplay}
          </p>
        </Card>

        {/* Card 3: Players Ativos (Amber/Laranja) */}
        <Card className="p-4 flex flex-col justify-between gap-1 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-500" /> Players Ativos
          </span>
          <p className="text-xl font-bold text-foreground">
            {activeTracks.filter(t => t.status === 'active').length}
          </p>
        </Card>

        {/* Card 4: Prazo (Condicional) */}
        <Card className={`p-4 flex flex-col justify-between gap-1 border-l-4 ${deadlineColorClass} shadow-sm hover:shadow-md transition-shadow`}>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            {isDeadlineOverdue ? (
               <WarningCircle className={`h-3.5 w-3.5 ${deadlineIconColor}`} />
            ) : (
               <CalendarBlank className={`h-3.5 w-3.5 ${deadlineIconColor}`} />
            )}
            Prazo Final
          </span>
          <p className={`text-xl font-bold truncate ${isDeadlineOverdue ? 'text-red-600' : 'text-foreground'}`}>
            {formatDate(deal.deadline)}
          </p>
        </Card>
      </div>

      {/* Tabs */}
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
          {currentUser && <CommentsPanel entityId={deal.id} entityType="deal" currentUser={currentUser} />}
        </TabsContent>

        <TabsContent value="ai">
          {currentUser && <AINextSteps dealId={deal.id} />}
        </TabsContent>
        <TabsContent value="fields">
          {currentUser && <CustomFieldsRenderer entityId={deal.id} entityType="deal" currentUser={currentUser} mode="edit" />}
        </TabsContent>

        <TabsContent value="activity">
          <ActivityHistory entityId={deal.id} entityType="deal" limit={50} />
        </TabsContent>
      </Tabs>

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