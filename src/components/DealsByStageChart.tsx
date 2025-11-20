import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerStage } from '@/lib/types'

interface DealsByStageChartProps {
  data: {
    stage: PlayerStage
    label: string
    count: number
  }[]
  onStageClick?: (stage: PlayerStage) => void
}

const STAGE_COLORS: Record<PlayerStage, string> = {
  nda: 'hsl(var(--chart-1))',
  analysis: 'hsl(var(--chart-2))',
  proposal: 'hsl(var(--chart-3))',
  negotiation: 'hsl(var(--chart-4))',
  closing: 'hsl(var(--chart-5))',
}

export default function DealsByStageChart({ data, onStageClick }: DealsByStageChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleBarClick = (entry: any, index: number) => {
    if (onStageClick && entry.stage) {
      onStageClick(entry.stage)
    }
  }

  const handleBarEnter = (_: any, index: number) => {
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
                    fill={STAGE_COLORS[entry.stage]}
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
