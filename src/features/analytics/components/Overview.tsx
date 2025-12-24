// src/features/analytics/components/Overview.tsx
import { useState } from 'react'
import { useDeals } from '@/services/dealService'
import { useTracks } from '@/services/trackService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Rocket,
} from 'lucide-react'
import { PlayerStage, STAGE_PROBABILITIES } from '@/lib/types'
import { formatCurrency, calculateWeightedVolume } from '@/lib/helpers'
import DealsList from '@/features/deals/components/DealsList'
import DealsByStageChart from '@/features/deals/components/DealsByStageChart'
import { CreateDealDialog } from '@/features/deals/components/CreateDealDialog'
import { toast } from 'sonner'

export default function Overview() {
  const { data: masterDeals } = useDeals()
  const { data: playerTracks } = useTracks()
  const [stageFilter, setStageFilter] = useState<PlayerStage | null>(null)
  const [createDealOpen, setCreateDealOpen] = useState(false)

  const activeDeals = (masterDeals || []).filter(d => d.status === 'active' && !d.deletedAt)
  const concludedDeals = (masterDeals || []).filter(d => d.status === 'concluded')
  const cancelledDeals = (masterDeals || []).filter(d => d.status === 'cancelled')

  const totalVolume = activeDeals.reduce((sum, deal) => sum + deal.volume, 0)

  const activeTracks = (playerTracks || []).filter(t => t.status === 'active')
  const weightedPipeline = activeTracks.reduce((sum, track) => {
    const probability = STAGE_PROBABILITIES[track.currentStage]
    return sum + calculateWeightedVolume(track.trackVolume, probability)
  }, 0)

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
            icon={<Rocket className="h-16 w-16" />}
            title="Bem-vindo ao PipeDesk!"
            description="Você ainda não tem nenhum negócio. Comece criando seu primeiro Master Deal."
            actionLabel="Criar Primeiro Negócio"
            onAction={() => setCreateDealOpen(true)}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Negócios Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{activeDeals.length}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {activeTracks.length} players em negociação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold break-words">{formatCurrency(totalVolume)}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Pipeline ativo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forecast Ponderado</CardTitle>
                <TrendingUp className="h-4 w-4 text-success flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold break-words">{formatCurrency(weightedPipeline)}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Baseado em probabilidades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {concludedDeals.length} concluídos / {cancelledDeals.length} cancelados
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Negócios por Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="text-sm">Ativos</span>
                  </div>
                  <Badge variant="secondary">{activeDeals.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm">Concluídos</span>
                  </div>
                  <Badge variant="secondary">{concludedDeals.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <span className="text-sm">Cancelados</span>
                  </div>
                  <Badge variant="secondary">{cancelledDeals.length}</Badge>
                </div>
              </CardContent>
            </Card>

            <DealsByStageChart
              data={stageChartData}
              onStageClick={handleStageClick}
            />
          </div>

          {stageFilter && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Filtro ativo: {stageChartData.find(s => s.stage === stageFilter)?.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredActiveTracks.length} players neste estágio
                </p>
              </div>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-destructive/10"
                onClick={() => handleStageClick(stageFilter)}
              >
                Limpar filtro
              </Badge>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Negócios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <DealsList deals={(masterDeals || []).slice(0, 5)} compact />
            </CardContent>
          </Card>
        </div>
      )}

      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />
    </>
  )
}