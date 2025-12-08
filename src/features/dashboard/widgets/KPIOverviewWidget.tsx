import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, ChartLine, Funnel, Users } from '@phosphor-icons/react'
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics'
import { useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import { Skeleton } from '@/components/ui/skeleton'
import { DateFilterType } from '@/types/metadata'

interface KPIOverviewWidgetProps {
  dateFilter?: DateFilterType;
  teamFilter?: string;
  typeFilter?: string;
}

export function KPIOverviewWidget({
  dateFilter,
  teamFilter,
  typeFilter
}: KPIOverviewWidgetProps) {
  // Use context filters by default, but allow prop override for backward compatibility
  const { filters } = useDashboardFilters()
  const effectiveDateFilter = dateFilter || filters.dateRangePreset
  const effectiveTeamFilter = teamFilter || filters.selectedTeamMemberId
  const effectiveTypeFilter = typeFilter || filters.selectedOperationTypeId
  
  const { data: metrics, isLoading } = useEnhancedAnalytics(
    effectiveDateFilter,
    effectiveTeamFilter,
    effectiveTypeFilter
  )

  if (isLoading) {
    return <KPISkeleton />
  }

  if (!metrics) {
    return <div className="text-sm text-destructive">Erro ao carregar KPIs</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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
  )
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2"><Skeleton className="h-4 w-[100px]" /></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
