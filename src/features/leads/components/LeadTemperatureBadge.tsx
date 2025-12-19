import { Badge } from '@/components/ui/badge'
import type { LeadPriorityBucket } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface LeadTemperatureBadgeProps {
  priorityBucket?: LeadPriorityBucket | null
  className?: string
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

interface TemperatureConfig {
  label: string
  variant: BadgeVariant
  className: string
}

const TEMPERATURE_CONFIG: Record<LeadPriorityBucket, TemperatureConfig> = {
  hot: {
    label: 'Quente',
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'
  },
  warm: {
    label: 'Morno',
    variant: 'secondary',
    className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100'
  },
  cold: {
    label: 'Frio',
    variant: 'outline',
    className: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50'
  }
}

export function LeadTemperatureBadge({ priorityBucket, className }: LeadTemperatureBadgeProps) {
  if (!priorityBucket) {
    return null
  }

  const config = TEMPERATURE_CONFIG[priorityBucket]

  return (
    <Badge
      variant={config.variant}
      className={cn('text-xs font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
