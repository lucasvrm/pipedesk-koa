import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard, EntityColor } from '@/components/ui/MetricCard'
import { cn } from '@/lib/utils'

interface MetricItem {
  label: string
  value: ReactNode
  icon?: ReactNode
  color?: EntityColor
}

interface KeyMetricsSidebarProps {
  title: ReactNode
  subtitle?: string
  statusBadge?: ReactNode
  metrics: MetricItem[]
  actions?: ReactNode
  className?: string
}

export function KeyMetricsSidebar({
  title,
  subtitle,
  statusBadge,
  metrics,
  actions,
  className
}: KeyMetricsSidebarProps) {
  return (
    <Card className={cn("border-l-4 border-l-primary h-fit shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2">
          {statusBadge && <div className="self-start">{statusBadge}</div>}
          <div>
            <CardTitle className="text-xl leading-tight">{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="space-y-3">
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
              color={metric.color || 'neutral'}
            />
          ))}
        </div>

        {/* Primary Actions Area */}
        {actions && (
          <div className="pt-4 border-t space-y-2">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
