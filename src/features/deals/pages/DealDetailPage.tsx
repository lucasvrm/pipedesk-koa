import { useParams, useNavigate } from 'react-router-dom'
import { useDeal, useUpdateDeal } from '@/services/dealService'
import { useTracks, useUpdateTrack } from '@/services/trackService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, OPERATION_LABELS, DealStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { 
  Plus, Users, ChatCircle, ClockCounterClockwise, 
  FileText, Sparkle, Tag, Question, ArrowLeft 
} from '@phosphor-icons/react'

// MUDANÇA: Importando o novo componente criado
import DealPlayersKanban from '../components/DealPlayersKanban' 

import CreatePlayerDialog from '../components/CreatePlayerDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'
import DocumentGenerator from '@/components/DocumentGenerator'
import AINextSteps from '@/components/AINextSteps'
import CustomFieldsRenderer from '@/components/CustomFieldsRenderer'
import QAPanel from '@/components/QAPanel'
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

  const dealTracks = (playerTracks || []).filter(t => t.masterDealId === deal.id)

  const handleStatusChange = (newStatus: DealStatus) => {
    if (newStatus === 'cancelled') {
      const activeTracks = dealTracks.filter(t => t.status === 'active')
      
      activeTracks.forEach(track => {
        updateTrack.mutate({
          trackId: track.id,
          updates: { status: 'cancelled' }
        })
      })

      updateDeal.mutate({
        dealId: deal.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => toast.success('Negócio cancelado e players atualizados.'),
        onError: () => toast.error('Erro ao atualizar status')
      })
    } else {
      updateDeal.mutate({
        dealId: deal.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`),
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

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/deals')} className="mb-4 pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Negócios
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{deal.clientName}</h1>
            <div className="flex items-center gap-3 text-sm">
              <Badge className={`font-normal ${getStatusColor(deal.status)}`}>
                {STATUS_LABELS[deal.status]}
              </Badge>
              <span className="text-muted-foreground">{OPERATION_LABELS[deal.operationType]}</span>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            <DocumentGenerator deal={deal} playerTracks={dealTracks} />
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200 shadow-sm">
          <CardHeader className="p-4 pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Volume Total</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xl font-bold text-blue-900 truncate" title={formatCurrency(deal.volume)}>
              {formatCurrency(deal.volume)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fee (%)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xl font-bold text-foreground">{deal.feePercentage ? `${deal.feePercentage}%` : '—'}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200 shadow-sm">
          <CardHeader className="p-4 pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold text-red-600 uppercase tracking-wider">Prazo Final</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xl font-bold text-red-900 flex items-center gap-2">
              {formatDate(deal.deadline)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200 shadow-sm">
          <CardHeader className="p-4 pb-1 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Players Ativos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xl font-bold text-amber-900">
              {dealTracks.filter(t => t.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="players" className="w-full space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
          <TabsTrigger value="players" className="py-2"><Users className="mr-2" /> Players</TabsTrigger>
          <TabsTrigger value="fields" className="py-2"><Tag className="mr-2" /> Campos</TabsTrigger>
          <TabsTrigger value="ai" className="py-2"><Sparkle className="mr-2" /> IA</TabsTrigger>
          <TabsTrigger value="qa" className="py-2"><Question className="mr-2" /> Q&A</TabsTrigger>
          <TabsTrigger value="comments" className="py-2"><ChatCircle className="mr-2" /> Comentários</TabsTrigger>
          <TabsTrigger value="documents" className="py-2"><FileText className="mr-2" /> Docs</TabsTrigger>
          <TabsTrigger value="activity" className="py-2"><ClockCounterClockwise className="mr-2" /> Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Players em Negociação</h3>
            <Button onClick={() => setCreatePlayerOpen(true)}>
              <Plus className="mr-2" /> Adicionar Player
            </Button>
          </div>
          
          {dealTracks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum player adicionado ainda</p>
              <Button variant="link" onClick={() => setCreatePlayerOpen(true)}>
                Adicionar Primeiro Player
              </Button>
            </div>
          ) : (
            // USA O NOVO COMPONENTE PARA EVITAR CONFLITO COM O KANBAN DE TAREFAS
            <DealPlayersKanban tracks={dealTracks} currentUser={currentUser} />
          )}

          {deal.observations && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                Observações do Negócio
              </h3>
              <div className="bg-muted/30 p-4 rounded-lg border text-sm text-muted-foreground leading-relaxed">
                {deal.observations}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fields">
          {currentUser && (
            <CustomFieldsRenderer entityId={deal.id} entityType="deal" currentUser={currentUser} mode="edit" />
          )}
        </TabsContent>

        <TabsContent value="ai">
          {currentUser && <AINextSteps dealId={deal.id} />}
        </TabsContent>

        <TabsContent value="qa">
          {currentUser && <QAPanel entityId={deal.id} entityType="deal" currentUser={currentUser} />}
        </TabsContent>

        <TabsContent value="comments">
          {currentUser && <CommentsPanel entityId={deal.id} entityType="deal" currentUser={currentUser} />}
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

        <TabsContent value="activity">
          <ActivityHistory entityId={deal.id} entityType="deal" limit={50} />
        </TabsContent>
      </Tabs>

      <CreatePlayerDialog 
        masterDeal={deal} 
        open={createPlayerOpen} 
        onOpenChange={setCreatePlayerOpen} 
      />
    </div>
  )
}