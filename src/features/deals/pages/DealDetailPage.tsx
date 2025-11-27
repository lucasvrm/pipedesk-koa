import { useParams, useNavigate } from 'react-router-dom'
import { useDeal, useUpdateDeal } from '@/services/dealService'
import { useTracks, useUpdateTrack } from '@/services/trackService'
import { logActivity } from '@/services/activityService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, OPERATION_LABELS, DealStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { 
  Plus, Users, ChatCircle, ClockCounterClockwise, 
  FileText, Sparkle, Tag, Question, ArrowLeft, PencilSimple,
  Kanban as KanbanIcon, List as ListIcon, Buildings
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
import { useState } from 'react'

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
  const [playersView, setPlayersView] = useState<'active' | 'dropped'>('active')

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

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/deals')} className="mb-4 pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Negócios
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{deal.clientName}</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setEditDealOpen(true)}
                title="Editar Informações"
              >
                <PencilSimple className="h-5 w-5" />
              </Button>
            </div>

            {deal.company && (
              <div className="flex items-center gap-1.5 text-muted-foreground mb-6 pl-0.5">
                <Buildings className="h-4 w-4" />
                <span className="font-medium text-sm">{deal.company.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 text-sm">
              <Badge className={`font-normal ${getStatusColor(deal.status)}`}>
                {STATUS_LABELS[deal.status]}
              </Badge>
              <span className="text-muted-foreground">{OPERATION_LABELS[deal.operationType]}</span>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            <DocumentGenerator deal={deal} playerTracks={activeTracks} />
            <Select value={deal.status} onValueChange={(v) => handleStatusChange(v as DealStatus)}>
              <SelectTrigger className={`w-[180px] border h-10 font-medium transition-colors ${getStatusColor(deal.status)}`}>
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
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Volume Total</span>
          <p className="text-lg font-bold text-blue-900 truncate" title={formatCurrency(deal.volume)}>
            {formatCurrency(deal.volume)}
          </p>
        </Card>

        <Card className="bg-card shadow-sm p-3 flex flex-col justify-center gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fee Estimado</span>
          <p className="text-sm font-bold text-foreground truncate" title={feeDisplay}>
            {feeDisplay}
          </p>
        </Card>

        <Card className="bg-red-50 border-red-200 shadow-sm p-3 flex flex-col justify-center gap-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Prazo Final</span>
          <p className="text-lg font-bold text-red-900 truncate">
            {formatDate(deal.deadline)}
          </p>
        </Card>

        <Card className="bg-amber-50 border-amber-200 shadow-sm p-3 flex flex-col justify-center gap-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Players Ativos</span>
          <p className="text-lg font-bold text-amber-900">
            {activeTracks.filter(t => t.status === 'active').length}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="players" className="w-full space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
          <TabsTrigger value="players" className="py-2"><Users className="mr-2" /> Players</TabsTrigger>
          <TabsTrigger value="documents" className="py-2"><FileText className="mr-2" /> Docs</TabsTrigger>
          <TabsTrigger value="comments" className="py-2"><ChatCircle className="mr-2" /> Comentários</TabsTrigger>
          
          <TabsTrigger value="ai" disabled className="py-2 opacity-50 cursor-not-allowed"><Sparkle className="mr-2" /> IA</TabsTrigger>
          <TabsTrigger value="fields" disabled className="py-2 opacity-50 cursor-not-allowed"><Tag className="mr-2" /> Campos</TabsTrigger>
          <TabsTrigger value="activity" className="py-2"><ClockCounterClockwise className="mr-2" /> Atividades</TabsTrigger>
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

            <Button onClick={() => setCreatePlayerOpen(true)}>
              <Plus className="mr-2" /> Adicionar Player
            </Button>
          </div>
          
          {playersView === 'active' ? (
            activeTracks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
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
    </div>
  )
}