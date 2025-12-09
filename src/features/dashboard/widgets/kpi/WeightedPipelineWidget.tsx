import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from '@phosphor-icons/react'
import { useAnalytics } from '@/services/analyticsService'
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { Skeleton } from '@/components/ui/skeleton'

export function WeightedPipelineWidget() {
  const { filters } = useDashboardFilters()
  const { data: metrics, isLoading, error } = useAnalytics(
    filters.dateRangePreset,
    filters.selectedTeamMemberId,
    filters.selectedOperationTypeId
  )

  if (isLoading) return <Skeleton className="h-[120px] w-full" />
  
  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Ponderado</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    )
  }
  
  if (!metrics) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Ponderado</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">R$ 0</div>
            <Target className="text-emerald-500" size={24} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Ponderado</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(metrics.weightedPipeline ?? 0)}</div>
          <Target className="text-emerald-500" size={24} />
        </div>
      </CardContent>
    </Card>
  )
}
