import { ConversionFunnel } from '@/features/analytics/components/charts/ConversionFunnel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Funnel } from '@phosphor-icons/react'

export function ConversionFunnelWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
         <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Funnel className="h-4 w-4" />
            Funil de Conversão
         </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ConversionFunnel />
      </CardContent>
    </Card>
  )
}
