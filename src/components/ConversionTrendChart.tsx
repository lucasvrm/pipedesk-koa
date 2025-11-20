import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ConversionTrendChartProps {
  data: {
    period: string
    concluded: number
    cancelled: number
    conversionRate: number
  }[]
  onDataPointClick?: (period: string) => void
}

interface ChartDataItem {
  period: string
  concluded: number
  cancelled: number
  conversionRate: number
}

interface ChartClickEvent {
  activePayload?: Array<{
    payload: ChartDataItem
  }>
}

export default function ConversionTrendChart({ data, onDataPointClick }: ConversionTrendChartProps) {
  const [highlightedPeriod, setHighlightedPeriod] = useState<string | null>(null)

  const handleClick = (event: ChartClickEvent) => {
    if (event && event.activePayload && event.activePayload[0]) {
      const period = event.activePayload[0].payload.period
      if (onDataPointClick) {
        onDataPointClick(period)
      }
    }
  }

  const chartConfig = {
    concluded: {
      label: 'Concluídos',
      color: 'hsl(var(--chart-4))',
    },
    cancelled: {
      label: 'Cancelados',
      color: 'hsl(var(--chart-1))',
    },
    conversionRate: {
      label: 'Taxa de Conversão (%)',
      color: 'hsl(var(--chart-2))',
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data}
              onClick={handleClick}
              onMouseMove={(e: ChartClickEvent) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setHighlightedPeriod(e.activePayload[0].payload.period)
                }
              }}
              onMouseLeave={() => setHighlightedPeriod(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: '%', position: 'insideRight' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="font-medium text-sm mb-2">
                        {payload[0].payload.period}
                      </div>
                      <div className="grid gap-1 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: chartConfig.concluded.color }} />
                            Concluídos
                          </span>
                          <span className="font-bold">{payload[0].payload.concluded}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: chartConfig.cancelled.color }} />
                            Cancelados
                          </span>
                          <span className="font-bold">{payload[0].payload.cancelled}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t">
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: chartConfig.conversionRate.color }} />
                            Taxa
                          </span>
                          <span className="font-bold">{payload[0].payload.conversionRate}%</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 border-t pt-1">
                        Clique para filtrar por período
                      </div>
                    </div>
                  )
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="line"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="concluded" 
                stroke={chartConfig.concluded.color}
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6, cursor: 'pointer' }}
                name="Concluídos"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="cancelled" 
                stroke={chartConfig.cancelled.color}
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6, cursor: 'pointer' }}
                name="Cancelados"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversionRate" 
                stroke={chartConfig.conversionRate.color}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6, cursor: 'pointer' }}
                name="Taxa (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
