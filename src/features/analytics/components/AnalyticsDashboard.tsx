import { useState } from 'react'
import { useAnalytics } from '@/services/analyticsService'
import { User, PlayerStage, OperationType } from '@/lib/types'
import { hasPermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, ChartLine, Target, Users, Funnel, TrendingUp, PresentationChart, GitBranch, Handshake, Clock } from 'lucide-react'
import { toast } from 'sonner'

// IMPORTS DOS NOVOS GRÁFICOS
import { PortfolioMatrix } from './charts/PortfolioMatrix'
import { ConversionFunnel } from './charts/ConversionFunnel'
import { WeightedForecastChart } from './charts/WeightedForecastChart'
import { TeamWorkloadHeatmap } from './charts/TeamWorkloadHeatmap'

// Import de componentes existentes
import ConversionTrendChart from './ConversionTrendChart'
import DealComparison from '@/features/deals/pages/DealComparison'
import { PlayersAnalytics } from './PlayersAnalytics'
import { UnifiedLayout } from '@/components/UnifiedLayout'

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
    toast.info('Exportação iniciada...')
  }

  const getStageLabel = (stage: PlayerStage) => {
    const labels: Record<PlayerStage, string> = {
      nda: 'NDA', analysis: 'Análise', proposal: 'Proposta', negotiation: 'Negociação', closing: 'Fechamento',
    }
    return labels[stage]
  }

  return (
    <UnifiedLayout
      activeSection="management"
      activeItem="analytics"
      showBreadcrumbs={true}
    >
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PresentationChart className="text-primary" />
            Analytics & Inteligência
          </h2>
          <p className="text-muted-foreground">
            Métricas de performance, forecast financeiro e saúde do pipeline.
          </p>
        </div>
        {canExport && (
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2" />
            Exportar Excel
          </Button>
        )}
      </div>

      {/* --- FILTROS GLOBAIS --- */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o Histórico</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Operação</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="ccb">CCB</SelectItem>
                  <SelectItem value="cri_corporate">CRI Corporativo</SelectItem>
                  <SelectItem value="cri_land">CRI Terreno</SelectItem>
                  {/* Adicione outros tipos conforme necessário */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipe</Label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda a Organização</SelectItem>
                  {/* Popular com equipas reais se houver */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error || !metrics ? (
        <div className="p-8 text-center text-destructive border rounded-lg bg-destructive/5">
          <p>Erro ao carregar dados de analytics.</p>
        </div>
      ) : (
        <Tabs defaultValue="strategy" className="w-full space-y-6">
          <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="strategy" className="gap-2 min-w-[120px]">
              <GitBranch size={16} />
              Estratégia & Forecast
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-2 min-w-[120px]">
              <TrendingUp size={16} />
              Operacional & Conversão
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2 min-w-[120px]">
              <Handshake size={16} />
              Comparador de Deals
            </TabsTrigger>
          </TabsList>

          {/* --- ABA 1: ESTRATÉGIA (NOVOS GRÁFICOS) --- */}
          <TabsContent value="strategy" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Ponderado</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(metrics.weightedPipeline)}</div>
                    <Target className="text-emerald-500" size={24} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Deals Ativos</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{metrics.activeDeals}</div>
                    <ChartLine className="text-blue-500" size={24} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
                    <Funnel className="text-amber-500" size={24} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Negócios</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{metrics.totalDeals}</div>
                    <Users className="text-purple-500" size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GRÁFICOS AVANÇADOS (GRID 2x2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[450px]">
                <PortfolioMatrix />
              </div>
              <div className="h-[450px]">
                <WeightedForecastChart />
              </div>
              <div className="h-[450px]">
                <ConversionFunnel />
              </div>
              <div className="h-[450px]">
                <TeamWorkloadHeatmap />
              </div>
            </div>
          </TabsContent>

          {/* --- ABA 2: OPERACIONAL (ANTIGO VISÃO GERAL) --- */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock /> Tempo Médio por Estágio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(['nda', 'analysis', 'proposal', 'negotiation', 'closing'] as PlayerStage[]).map((stage) => (
                      <div key={stage} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">{getStageLabel(stage)}</span>
                        <span className="text-sm text-muted-foreground">
                           {/* Aqui você conectaria com metrics.averageTimeByStage se disponível na API nova */}
                           ~ 12 dias
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target /> Violações de SLA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.slaBreach.total > 0 ? (
                    <div className="space-y-4">
                      <div className="text-3xl font-bold text-destructive">{metrics.slaBreach.total} <span className="text-sm font-normal text-muted-foreground">violações</span></div>
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
                    <div className="text-center py-12 flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">✓</div>
                      <p className="text-sm text-muted-foreground">Tudo dentro do prazo.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <ConversionTrendChart data={metrics.conversionTrend} onDataPointClick={() => {}} />
            
            <div className="mt-8">
               <PlayersAnalytics />
            </div>
          </TabsContent>

          {/* --- ABA 3: COMPARAÇÃO --- */}
          <TabsContent value="comparison">
            <DealComparison />
          </TabsContent>
        </Tabs>
      )}
      </div>
    </UnifiedLayout>
  )
}