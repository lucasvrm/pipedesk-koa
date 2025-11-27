import { useState } from 'react'
import { useAnalytics } from '@/services/analyticsService'
import {
  User,
  PlayerStage,
  OperationType,
} from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' // Tabs adicionadas
import { Download, ChartLine, Clock, Target, Users, Funnel, ChartLineUp, PresentationChart } from '@phosphor-icons/react'
import { toast } from 'sonner'
import ConversionTrendChart from './ConversionTrendChart'
import { PlayersAnalytics } from './PlayersAnalytics'
import DealComparison from '@/features/deals/pages/DealComparison' // Importando a Comparação

interface AnalyticsDashboardProps {
  currentUser: User
}

export default function AnalyticsDashboard({ currentUser }: AnalyticsDashboardProps) {
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | '1y'>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<OperationType | 'all'>('all')

  const { data: metrics, isLoading, error } = useAnalytics(dateFilter, teamFilter, typeFilter)

  const canView = hasPermission(currentUser.role, 'VIEW_ANALYTICS')
  const canExport = hasPermission(currentUser.role, 'EXPORT_DATA')

  if (!canView) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Você não tem permissão para visualizar analytics</p>
      </div>
    )
  }

  const handleExport = () => {
    if (!canExport) {
      toast.error('Você não tem permissão para exportar dados')
      return
    }
    toast.info('Exportação será implementada em breve com a nova API')
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

  const handlePeriodClick = (period: string) => {
    toast.info(`Filtrando por período: ${period}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Inteligência</h2>
          <p className="text-muted-foreground">
            Métricas de performance e comparação de cenários
          </p>
        </div>
        {canExport && (
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2" />
            Exportar Excel
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <PresentationChart size={16} />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <ChartLineUp size={16} />
            Comparação de Deals
          </TabsTrigger>
        </TabsList>

        {/* --- ABA VISÃO GERAL --- */}
        <TabsContent value="overview" className="space-y-6">
          {/* Conteúdo de Loading/Erro Movido para dentro da Tab para não quebrar a estrutura */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error || !metrics ? (
            <div className="p-8 text-center text-destructive">
                <p>Erro ao carregar dados de analytics. Tente novamente mais tarde.</p>
            </div>
          ) : (
            <>
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
                        <div className="text-3xl font-bold">{metrics.activeDeals}</div>
                        <ChartLine className="text-primary" size={32} />
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
                            }).format(metrics.weightedPipeline)}
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
                        <div className="text-3xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
                        <ChartLine className="text-primary" size={32} />
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
                        <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold">{metrics.totalDeals}</div>
                        <Users className="text-muted-foreground" size={32} />
                        </div>
                    </CardContent>
                    </Card>
                </div>

                {/* Dashboard de Players */}
                <PlayersAnalytics />

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
                            (stage) => (
                            <div key={stage} className="flex items-center justify-between">
                                <span className="text-sm font-medium">{getStageLabel(stage)}</span>
                                <span className="text-sm text-muted-foreground">-</span>
                            </div>
                            )
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
                        {metrics.slaBreach.total > 0 ? (
                        <div className="space-y-4">
                            <div className="text-3xl font-bold text-destructive">
                            {metrics.slaBreach.total}
                            </div>
                            <div className="space-y-2">
                            {Object.entries(metrics.slaBreach.byStage).map(([stage, count]) => (
                                count > 0 && (
                                <div key={stage} className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{getStageLabel(stage as PlayerStage)}</span>
                                    <span className="text-destructive font-medium">{count}</span>
                                </div>
                                )
                            ))}
                            </div>
                        </div>
                        ) : (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2">✓</div>
                            <p className="text-sm text-muted-foreground">Nenhuma violação de SLA</p>
                        </div>
                        )}
                    </CardContent>
                    </Card>
                </div>

                <ConversionTrendChart
                    data={metrics.conversionTrend}
                    onDataPointClick={handlePeriodClick}
                />
            </>
          )}
        </TabsContent>

        {/* --- ABA COMPARAÇÃO --- */}
        <TabsContent value="comparison">
            <DealComparison />
        </TabsContent>
      </Tabs>
    </div>
  )
}