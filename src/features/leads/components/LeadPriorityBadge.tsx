import { Flame } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { LeadPriorityBucket } from '@/lib/types'
import { cn, safeStringOptional } from '@/lib/utils'

type PriorityBucket = LeadPriorityBucket | null | undefined

interface LeadPriorityBadgeProps {
  priorityBucket?: PriorityBucket
  priorityScore?: number | null
  priorityDescription?: string | null
  className?: string
}

const PRIORITY_COLORS: Record<LeadPriorityBucket, string> = {
  hot: 'bg-destructive/20 text-destructive',
  warm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100',
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100'
}

const PRIORITY_LABELS: Record<LeadPriorityBucket, string> = {
  hot: 'Prioridade Alta',
  warm: 'Prioridade Média',
  cold: 'Prioridade Baixa'
}

const PRIORITY_TOOLTIP_COLORS: Record<LeadPriorityBucket, string> = {
  hot: 'bg-red-600 text-white',
  warm: 'bg-yellow-400 text-gray-900',
  cold: 'bg-blue-600 text-white'
}

export function LeadPriorityBadge({
  priorityBucket,
  priorityScore,
  priorityDescription,
  className
}: LeadPriorityBadgeProps) {
  const safePriorityBucket: LeadPriorityBucket = priorityBucket ?? 'cold'
  const safePriorityDescription = safeStringOptional(priorityDescription)
  const hasScore = priorityScore !== undefined && priorityScore !== null

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold',
              PRIORITY_COLORS[safePriorityBucket],
              className
            )}
            aria-label={PRIORITY_LABELS[safePriorityBucket]}
          >
            <Flame className="h-[18px] w-[18px]" />
          </div>
        </TooltipTrigger>
        <TooltipContent className={cn('max-w-xs text-left space-y-1', PRIORITY_TOOLTIP_COLORS[safePriorityBucket])}>
          <div className="font-semibold">{PRIORITY_LABELS[safePriorityBucket]}</div>
          {hasScore && <div className="opacity-90">Score: {priorityScore}</div>}
          {safePriorityDescription && (
            <div className="opacity-90 text-xs leading-relaxed">{safePriorityDescription}</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
