import { useMemo, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { TimelineItemType } from './types'

export interface TimelineMilestone {
  id: string
  label: string
  date: string
  type: TimelineItemType
  isImportant?: boolean
}

interface HorizontalTimelineProps {
  milestones: TimelineMilestone[]
  onMilestoneClick?: (id: string) => void
}

const TYPE_COLORS: Record<TimelineItemType, { dot: string; text: string }> = {
  comment: { dot: 'bg-yellow-400', text: 'text-yellow-700' },
  email: { dot: 'bg-blue-500', text: 'text-blue-600' },
  meeting: { dot: 'bg-red-500', text: 'text-red-600' },
  audit: { dot: 'bg-amber-500', text: 'text-amber-600' },
  system: { dot: 'bg-slate-400', text: 'text-slate-500' }
}

export function HorizontalTimeline({
  milestones,
  onMilestoneClick
}: HorizontalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sort milestones by date (oldest first)
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [milestones])

  // Scroll to end (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [sortedMilestones])

  // Current milestone is the most recent
  const currentMilestoneId = sortedMilestones[sortedMilestones.length - 1]?.id

  if (milestones.length === 0) return null

  return (
    <div className="border-b bg-muted/20 flex-shrink-0 h-[72px]">
      {/* Horizontal scroll container - MUST be single line */}
      <div
        ref={scrollRef}
        className="h-full flex flex-row items-center px-4 gap-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {sortedMilestones.map((milestone, index) => {
          const colors = TYPE_COLORS[milestone.type] || TYPE_COLORS.system
          const isCurrent = milestone.id === currentMilestoneId
          const isLast = index === sortedMilestones.length - 1

          return (
            <div
              key={milestone.id}
              className="flex flex-row items-center flex-shrink-0 h-full"
            >
              {/* Milestone button */}
              <button
                type="button"
                onClick={() => onMilestoneClick?.(milestone.id)}
                className={cn(
                  "flex flex-col items-center justify-center h-full px-2 rounded hover:bg-muted/50 transition-colors",
                  onMilestoneClick && "cursor-pointer"
                )}
                style={{ minWidth: '72px', maxWidth: '88px' }}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    colors.dot,
                    isCurrent && "ring-2 ring-offset-1 ring-primary",
                    milestone.isImportant && "ring-2 ring-offset-1 ring-amber-400"
                  )}
                />
                {/* Label */}
                <span
                  className={cn(
                    "mt-1 text-[10px] font-medium leading-tight text-center truncate w-full",
                    isCurrent ? "text-foreground font-semibold" : colors.text
                  )}
                >
                  {milestone.label}
                </span>
                {/* Date */}
                <span className="text-[9px] text-muted-foreground leading-tight">
                  {format(new Date(milestone.date), 'dd/MM', { locale: ptBR })}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="w-6 h-0.5 bg-border flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
