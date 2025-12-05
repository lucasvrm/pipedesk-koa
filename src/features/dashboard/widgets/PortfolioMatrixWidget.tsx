import { PortfolioMatrix } from '@/features/analytics/components/charts/PortfolioMatrix'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Strategy } from '@phosphor-icons/react'

export function PortfolioMatrixWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
         <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Strategy className="h-4 w-4" />
            Matriz de Portfólio
         </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <PortfolioMatrix />
      </CardContent>
    </Card>
  )
}
