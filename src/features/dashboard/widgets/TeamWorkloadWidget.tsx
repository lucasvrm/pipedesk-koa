import { TeamWorkloadHeatmap } from '@/features/analytics/components/charts/TeamWorkloadHeatmap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from '@phosphor-icons/react'

export function TeamWorkloadWidget() {
  return (
    <Card className="h-full">
      <CardHeader>
         <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Carga de Trabalho da Equipe
         </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <TeamWorkloadHeatmap />
      </CardContent>
    </Card>
  )
}
