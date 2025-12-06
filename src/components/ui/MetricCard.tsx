import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Entity colors following the UI/UX audit report
 * Maps entity types to Tailwind color classes for border-left styling
 */
export const ENTITY_COLORS = {
  lead: 'border-l-purple-500',
  deal: 'border-l-blue-500',
  track: 'border-l-emerald-500',
  contact: 'border-l-orange-500',
  company: 'border-l-indigo-500',
  player: 'border-l-cyan-500',
  neutral: 'border-l-slate-300',
} as const

export type EntityColor = keyof typeof ENTITY_COLORS

interface MetricCardProps {
  icon?: ReactNode
  label: string
  value: ReactNode
  color?: EntityColor
  className?: string
}

/**
 * MetricCard component with colored left border
 * 
 * Follows the pattern from UI/UX audit:
 * - Card with p-4 padding
 * - border-l-4 colored border
 * - Icon + label in small text
 * - Large, bold value display
 * 
 * Pure presentation component with no business logic
 * 
 * @example
 * <MetricCard 
 *   icon={<DollarSign className="h-3.5 w-3.5" />}
 *   label="Volume Total"
 *   value="R$ 1.500.000"
 *   color="deal"
 * />
 */
export function MetricCard({ 
  icon, 
  label, 
  value, 
  color = 'neutral', 
  className 
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        'p-4 border-l-4',
        ENTITY_COLORS[color],
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon && (
          <div className="shrink-0">
            {icon}
          </div>
        )}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold">
        {value}
      </div>
    </Card>
  )
}
