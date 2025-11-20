import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendUp, 
  CurrencyCircleDollar, 
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react'
import { MasterDeal, PlayerTrack } from '@/lib/types'
import { formatCurrency, calculateWeightedVolume } from '@/lib/helpers'
import { STAGE_PROBABILITIES } from '@/lib/types'
import DealsList from './DealsList'

export default function Dashboard() {
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])

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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral dos seus negócios</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Ativos</CardTitle>
            <TrendUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTracks.length} players em negociação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <CurrencyCircleDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pipeline ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Ponderado</CardTitle>
            <TrendUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weightedPipeline)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em probabilidades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
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

        <Card>
          <CardHeader>
            <CardTitle>Players por Estágio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries({
              nda: 'NDA',
              analysis: 'Análise',
              proposal: 'Proposta',
              negotiation: 'Negociação',
              closing: 'Fechamento',
            }).map(([stage, label]) => {
              const count = activeTracks.filter(t => t.currentStage === stage).length
              return (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Negócios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <DealsList deals={(masterDeals || []).slice(0, 5)} compact />
        </CardContent>
      </Card>
    </div>
  )
}
