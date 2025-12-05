import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartLine } from '@phosphor-icons/react'
import { useAnalytics } from '@/services/analyticsService'
import { Skeleton } from '@/components/ui/skeleton'

export function ActiveDealsWidget() {
  const { data: metrics, isLoading } = useAnalytics('all', 'all', 'all')

  if (isLoading) return <Skeleton className="h-[120px] w-full" />
  if (!metrics) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Deals Ativos</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{metrics.activeDeals}</div>
          <ChartLine className="text-blue-500" size={24} />
        </div>
      </CardContent>
    </Card>
  )
}
