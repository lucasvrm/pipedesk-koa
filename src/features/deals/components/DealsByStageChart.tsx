import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerStage } from '@/lib/types'
import { useStages } from '@/services/pipelineService'

interface DealsByStageChartProps {
  data: {
    stage: PlayerStage
    label: string
    count: number
  }[]
  onStageClick?: (stage: PlayerStage) => void
}

interface ChartDataItem {
  stage: PlayerStage
  label: string
  count: number
}

export default function DealsByStageChart({ data, onStageClick }: DealsByStageChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { data: stages = [] } = useStages()

  const handleBarClick = (entry: ChartDataItem) => {
    if (onStageClick && entry.stage) {
      onStageClick(entry.stage)
    }
  }

  const handleBarEnter = (_data: ChartDataItem, index: number) => {
    setActiveIndex(index)
  }

  const handleBarLeave = () => {
    setActiveIndex(null)
  }

  const chartConfig = {
    count: {
      label: 'Quantidade',
    },
  }

  // Helper para cor
  const getStageColor = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    return stage?.color || 'hsl(var(--primary))'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Players por Estágio</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-xs text-muted-foreground">
                          {payload[0].payload.label}
                        </span>
                        <span className="text-xs font-bold">
                          {payload[0].value} players
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Clique para filtrar
                      </div>
                    </div>
                  )
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
                onClick={handleBarClick}
                onMouseEnter={handleBarEnter}
                onMouseLeave={handleBarLeave}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStageColor(entry.stage)}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}