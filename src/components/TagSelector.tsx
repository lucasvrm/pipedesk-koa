import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeals } from '@/services/dealService'
import { useTracks } from '@/services/trackService'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import {
  TrendUp,
  CurrencyCircleDollar,
  CheckCircle,
  RocketLaunch,
  ListChecks,
  CalendarCheck,
  Clock,
  ArrowRight
} from '@phosphor-icons/react'
import { PlayerStage, STAGE_PROBABILITIES } from '@/lib/types'
import { formatCurrency, calculateWeightedVolume, formatDate } from '@/lib/helpers'
import DealsList from '@/features/deals/components/DealsList'
import DealsByStageChart from '@/features/deals/components/DealsByStageChart'
import { CreateDealDialog } from '@/features/deals/components/CreateDealDialog'
import { toast } from 'sonner'

export default function Overview() {
  const navigate = useNavigate()
  const { data: masterDeals } = useDeals()
  const { data: playerTracks } = useTracks()
  const { data: allTasks } = useTasks() // Novo hook de tasks
  
  const [stageFilter, setStageFilter] = useState<PlayerStage | null>(null)
  const [createDealOpen, setCreateDealOpen] = useState(false)

  // Cálculos de Deals
  const activeDeals = (masterDeals || []).filter(d => d.status === 'active' && !d.deletedAt)
  const concludedDeals = (masterDeals || []).filter(d => d.status === 'concluded')
  const cancelledDeals = (masterDeals || []).filter(d => d.status === 'cancelled')
  const totalVolume = activeDeals.reduce((sum, deal) => sum + deal.volume, 0)

  // Cálculos de Tracks
  const activeTracks = (playerTracks || []).filter(t => t.status === 'active')
  const weightedPipeline = activeTracks.reduce((sum, track) => {
    const probability = STAGE_PROBABILITIES[track.currentStage]
    return sum + calculateWeightedVolume(track.trackVolume, probability)
  }, 0)

  // Cálculos de Tarefas (Novo)
  const taskMetrics = useMemo(() => {
    if (!allTasks) return { pending: 0, today: 0, tomorrow: 0 }
    
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    return {
      pending: allTasks.filter(t => !t.completed).length,
      today: allTasks.filter(t => !t.completed && t.dueDate && t.dueDate.startsWith(todayStr)).length,
      tomorrow: allTasks.filter(t => !t.completed && t.dueDate && t.dueDate.startsWith(tomorrowStr)).length
    }
  }, [allTasks])

  const conversionRate = (masterDeals || []).length > 0
    ? (concludedDeals.length / (masterDeals || []).length) * 100
    : 0

  const stageChartData = [
    { stage: 'nda' as PlayerStage, label: 'NDA', count: activeTracks.filter(t => t.currentStage === 'nda').length },
    { stage: 'analysis' as PlayerStage, label: 'Análise', count: activeTracks.filter(t => t.currentStage === 'analysis').length },
    { stage: 'proposal' as PlayerStage, label: 'Proposta', count: activeTracks.filter(t => t.currentStage === 'proposal').length },
    { stage: 'negotiation' as PlayerStage, label: 'Negociação', count: activeTracks.filter(t => t.currentStage === 'negotiation').length },
    { stage: 'closing' as PlayerStage, label: 'Fechamento', count: activeTracks.filter(t => t.currentStage === 'closing').length },
  ]

  const handleStageClick = (stage: PlayerStage) => {
    setStageFilter(stage === stageFilter ? null : stage)
    const stageName = stageChartData.find(s => s.stage === stage)?.label
    toast.info(`${stage === stageFilter ? 'Removido filtro' : 'Filtrando'} por estágio: ${stageName}`)
  }

  const filteredActiveTracks = stageFilter
    ? activeTracks.filter(t => t.currentStage === stageFilter)
    : activeTracks

  return (
    <>
      {(masterDeals || []).length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            icon={<RocketLaunch size={64} weight="duotone" />}
            title="Bem-vindo ao PipeDesk!"
            description="Você ainda não tem nenhum deal. Comece criando seu primeiro Master Deal."
            actionLabel="Criar Primeiro Deal"
            onAction={() => setCreateDealOpen(true)}
          />
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          
          {/* 1. CARDS DE MÉTRICAS (Topo) - Clicáveis */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/deals')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deals Ativos</CardTitle>
                <TrendUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeDeals.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTracks.length} players em negociação
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/deals')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                <CurrencyCircleDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate" title={formatCurrency(totalVolume)}>{formatCurrency(totalVolume)}</div>
                <p className="text-xs text-muted-foreground mt-1">Pipeline ativo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forecast Ponderado</CardTitle>
                <TrendUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate" title={formatCurrency(weightedPipeline)}>{formatCurrency(weightedPipeline)}</div>
                <p className="text-xs text-muted-foreground mt-1">Baseado em probabilidades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {concludedDeals.length} ganhos / {cancelledDeals.length} perdidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2. NOVA SEÇÃO DE TAREFAS */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ListChecks className="text-primary" /> Minhas Tarefas
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              
              {/* Pendentes */}
              <Card className="bg-card hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => navigate('/tasks')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                      <ListChecks size={20} weight="bold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                      <p className="text-2xl font-bold text-foreground">{taskMetrics.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vencem Hoje */}
              <Card className={`bg-card hover:bg-accent/20 transition-colors cursor-pointer ${taskMetrics.today > 0 ? 'border-amber-300 bg-amber-50/30' : ''}`} onClick={() => navigate('/tasks')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-full">
                      <Clock size={20} weight="bold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vencem Hoje</p>
                      <p className="text-2xl font-bold text-amber-700">{taskMetrics.today}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vencem Amanhã */}
              <Card className="bg-card hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => navigate('/tasks')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                      <CalendarCheck size={20} weight="bold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vencem Amanhã</p>
                      <p className="text-2xl font-bold text-emerald-700">{taskMetrics.tomorrow}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. GRÁFICOS E LISTAS */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Deals por Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">Ativos</span>
                  </div>
                  <span className="font-bold">{activeDeals.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Concluídos</span>
                  </div>
                  <span className="font-bold">{concludedDeals.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Cancelados</span>
                  </div>
                  <span className="font-bold">{cancelledDeals.length}</span>
                </div>
              </CardContent>
            </Card>

            <DealsByStageChart data={stageChartData} onStageClick={handleStageClick} />
          </div>

          {/* 4. DEALS RECENTES (EM GRID) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <RocketLaunch className="text-primary" /> Deals Recentes
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/deals')}>
                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Renderiza lista em modo Grid */}
            <DealsList 
              deals={(masterDeals || []).slice(0, 6)} 
              playerTracks={playerTracks} 
              viewMode="grid" // Força o modo Grid
            />
          </div>

        </div>
      )}

      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />
    </>
  )
}