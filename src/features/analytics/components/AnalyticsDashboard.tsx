import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  MasterDeal,
  PlayerTrack,
  Task,
  User,
  StageHistory,
  PlayerStage,
  OperationType,
} from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, ChartLine, Clock, Target, Users, Funnel } from '@phosphor-icons/react'
import { toast } from 'sonner'
import ConversionTrendChart from './ConversionTrendChart'

interface AnalyticsDashboardProps {
  currentUser: User
}

export default function AnalyticsDashboard({ currentUser }: AnalyticsDashboardProps) {
  const [deals] = useKV<MasterDeal[]>('masterDeals', [])
  const [tracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [users] = useKV<User[]>('users', [])
  const [stageHistory] = useKV<StageHistory[]>('stageHistory', [])

  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | '1y'>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<OperationType | 'all'>('all')

  const canView = hasPermission(currentUser.role, 'VIEW_ANALYTICS')
  const canExport = hasPermission(currentUser.role, 'EXPORT_DATA')

  if (!canView) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Você não tem permissão para visualizar analytics</p>
      </div>
    )
  }

  const getDateFilterDate = () => {
    const now = new Date()
    switch (dateFilter) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      default:
        return null
    }
  }

  const filterDate = getDateFilterDate()

  const filteredDeals = (deals || []).filter((deal) => {
    if (filterDate && new Date(deal.createdAt) < filterDate) return false
    if (typeFilter !== 'all' && deal.operationType !== typeFilter) return false
    return true
  })

  const filteredTracks = (tracks || []).filter((track) => {
    const trackDeal = filteredDeals.find((d) => d.id === track.masterDealId)
    if (!trackDeal) return false
    if (teamFilter !== 'all' && !track.responsibles.includes(teamFilter)) return false
    return true
  })

  const activeDeals = filteredDeals.filter((d) => d.status === 'active').length
  const activeTracks = filteredTracks.filter((t) => t.status === 'active').length
  const concludedDeals = filteredDeals.filter((d) => d.status === 'concluded').length
  const cancelledDeals = filteredDeals.filter((d) => d.status === 'cancelled').length

  const weightedPipeline = filteredTracks
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + t.trackVolume * (t.probability / 100), 0)

  const conversionRate =
    activeDeals + concludedDeals > 0
      ? (concludedDeals / (activeDeals + concludedDeals)) * 100
      : 0

  const calculateAverageTimeInStage = (stage: PlayerStage): number => {
    const stageRecords = (stageHistory || []).filter(
      (h) => h.stage === stage && h.exitedAt
    )
    if (stageRecords.length === 0) return 0

    const totalHours = stageRecords.reduce((sum, h) => sum + (h.durationHours || 0), 0)
    return totalHours / stageRecords.length
  }

  const calculateSLABreaches = (): { stage: PlayerStage; count: number }[] => {
    const SLA_LIMITS: Record<PlayerStage, number> = {
      nda: 72,
      analysis: 120,
      proposal: 168,
      negotiation: 240,
      closing: 168,
    }

    const breaches: { stage: PlayerStage; count: number }[] = []

    Object.entries(SLA_LIMITS).forEach(([stage, maxHours]) => {
      const count = (stageHistory || []).filter(
        (h) =>
          h.stage === stage &&
          !h.exitedAt &&
          new Date().getTime() - new Date(h.enteredAt).getTime() >
            maxHours * 60 * 60 * 1000
      ).length

      if (count > 0) {
        breaches.push({ stage: stage as PlayerStage, count })
      }
    })

    return breaches
  }

  const slaBreach = calculateSLABreaches()
  const totalBreaches = slaBreach.reduce((sum, b) => sum + b.count, 0)

  const teamWorkload = (users || [])
    .filter((u) => u.role === 'analyst' || u.role === 'admin')
    .map((user) => {
      const userTracks = filteredTracks.filter(
        (t) => t.status === 'active' && t.responsibles.includes(user.id)
      ).length

      const userTasks = (tasks || []).filter(
        (t) => !t.completed && t.assignees.includes(user.id)
      ).length

      return {
        userId: user.id,
        userName: user.name,
        activeTracks: userTracks,
        activeTasks: userTasks,
      }
    })

  const handleExport = () => {
    if (!canExport) {
      toast.error('Você não tem permissão para exportar dados')
      return
    }

    const csvRows: string[][] = []
    csvRows.push(['Tipo', 'ID', 'Nome', 'Status', 'Volume', 'Criado Em', 'Atualizado Em'])

    filteredDeals.forEach((deal) => {
      csvRows.push([
        'Deal',
        deal.id,
        deal.clientName,
        deal.status,
        deal.volume.toString(),
        deal.createdAt,
        deal.updatedAt,
      ])
    })

    filteredTracks.forEach((track) => {
      csvRows.push([
        'Player',
        track.id,
        track.playerName,
        track.status,
        track.trackVolume.toString(),
        track.createdAt,
        track.updatedAt,
      ])
    })

    const csvContent = csvRows.map((row) => row.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dcm-analytics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Dados exportados com sucesso (formato Excel/CSV)')
  }

  const getStageLabel = (stage: PlayerStage) => {
    const labels: Record<PlayerStage, string> = {
      nda: 'NDA',
      analysis: 'Análise',
      proposal: 'Proposta',
      negotiation: 'Negociação',
      closing: 'Fechamento',
    }
    return labels[stage]
  }

  // Prepare conversion trend data (last 6 months)
  const conversionTrendData = (() => {
    const monthsData: Array<{
      period: string
      concluded: number
      cancelled: number
      conversionRate: number
    }> = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      
      const monthDeals = filteredDeals.filter(d => d.createdAt.startsWith(monthKey))
      const monthConcluded = monthDeals.filter(d => d.status === 'concluded').length
      const monthCancelled = monthDeals.filter(d => d.status === 'cancelled').length
      const monthTotal = monthConcluded + monthCancelled
      const rate = monthTotal > 0 ? Math.round((monthConcluded / monthTotal) * 100) : 0
      
      monthsData.push({
        period: monthLabel,
        concluded: monthConcluded,
        cancelled: monthCancelled,
        conversionRate: rate,
      })
    }
    
    return monthsData
  })()

  const handlePeriodClick = (period: string) => {
    toast.info(`Filtrando por período: ${period}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Métricas e indicadores de performance
          </p>
        </div>
        {canExport && (
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2" />
            Exportar Excel
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Funnel />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Operação</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="acquisition">Aquisição</SelectItem>
                  <SelectItem value="merger">Fusão</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                  <SelectItem value="divestment">Desinvestimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipe</Label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as equipes</SelectItem>
                  {(users || [])
                    .filter((u) => u.role === 'analyst' || u.role === 'admin')
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Negócios Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{activeDeals}</div>
              <ChartLine className="text-primary" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Players Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{activeTracks}</div>
              <Users className="text-success" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pipeline Ponderado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(weightedPipeline)}
              </div>
              <Target className="text-accent" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{conversionRate.toFixed(1)}%</div>
              <ChartLine className="text-primary" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock />
              Tempo Médio por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['nda', 'analysis', 'proposal', 'negotiation', 'closing'] as PlayerStage[]).map(
                (stage) => {
                  const avgHours = calculateAverageTimeInStage(stage)
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{getStageLabel(stage)}</span>
                      <span className="text-sm text-muted-foreground">
                        {avgHours > 0
                          ? `${Math.round(avgHours)}h (${Math.round(avgHours / 24)}d)`
                          : '-'}
                      </span>
                    </div>
                  )
                }
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target />
              Violações de SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalBreaches > 0 ? (
              <div className="space-y-4">
                <div className="text-3xl font-bold text-destructive">
                  {totalBreaches}
                </div>
                <div className="space-y-2">
                  {slaBreach.map((breach) => (
                    <div
                      key={breach.stage}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">{getStageLabel(breach.stage)}</span>
                      <span className="text-destructive font-medium">
                        {breach.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-sm text-muted-foreground">
                  Nenhuma violação de SLA
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            Carga de Trabalho por Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamWorkload.map((workload) => (
              <div
                key={workload.userId}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <span className="font-medium">{workload.userName}</span>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Players: </span>
                    <span className="font-medium">{workload.activeTracks}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tarefas: </span>
                    <span className="font-medium">{workload.activeTasks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConversionTrendChart 
        data={conversionTrendData}
        onDataPointClick={handlePeriodClick}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{concludedDeals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {cancelledDeals}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Negócios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDeals.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
