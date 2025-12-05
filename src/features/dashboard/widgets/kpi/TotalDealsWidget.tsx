import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from '@phosphor-icons/react'
import { useAnalytics } from '@/services/analyticsService'
import { Skeleton } from '@/components/ui/skeleton'

export function TotalDealsWidget() {
  const { data: metrics, isLoading } = useAnalytics('all', 'all', 'all')

  if (isLoading) return <Skeleton className="h-[120px] w-full" />
  if (!metrics) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Negócios</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{metrics.totalDeals}</div>
          <Users className="text-purple-500" size={24} />
        </div>
      </CardContent>
    </Card>
  )
}
