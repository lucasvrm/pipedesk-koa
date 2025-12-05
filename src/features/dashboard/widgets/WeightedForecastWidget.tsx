import { WeightedForecastChart } from '@/features/analytics/components/charts/WeightedForecastChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartLineUp } from '@phosphor-icons/react'

export function WeightedForecastWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
         <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ChartLineUp className="h-4 w-4" />
            Forecast Ponderado
         </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <WeightedForecastChart />
      </CardContent>
    </Card>
  )
}
