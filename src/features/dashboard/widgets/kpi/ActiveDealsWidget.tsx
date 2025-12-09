import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartLine } from '@phosphor-icons/react'
import { useAnalytics } from '@/services/analyticsService'
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { Skeleton } from '@/components/ui/skeleton'

export function ActiveDealsWidget() {
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
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Deals Ativos</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    )
  }
  
  if (!metrics) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Deals Ativos</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">0</div>
            <ChartLine className="text-blue-500" size={24} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Deals Ativos</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{metrics.activeDeals ?? 0}</div>
          <ChartLine className="text-blue-500" size={24} />
        </div>
      </CardContent>
    </Card>
  )
}
