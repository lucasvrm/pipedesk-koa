import { useMemo, useRef } from 'react'
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

const TYPE_COLORS: Record<TimelineItemType, { bg: string; border: string; text: string }> = {
  comment: {
    bg: 'bg-yellow-400',
    border: 'border-yellow-500',
    text: 'text-yellow-700'
  },
  email: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    text: 'text-blue-600'
  },
  meeting: {
    bg: 'bg-red-500',
    border: 'border-red-400',
    text: 'text-red-600'
  },
  audit: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    text: 'text-amber-600'
  },
  system: {
    bg: 'bg-slate-400',
    border: 'border-slate-300',
    text: 'text-slate-500'
  }
}

export function HorizontalTimeline({
  milestones,
  onMilestoneClick
}: HorizontalTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sort milestones by date (oldest first for horizontal display)
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [milestones])

  // Identify current (most recent) milestone
  const currentMilestoneId = useMemo(() => {
    if (sortedMilestones.length === 0) return null
    return sortedMilestones[sortedMilestones.length - 1].id
  }, [sortedMilestones])

  const handleClick = (id: string) => {
    onMilestoneClick?.(id)
  }

  if (milestones.length === 0) return null

  return (
    <div className="relative px-4 py-4 border-b bg-muted/20 flex-shrink-0">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pb-1"
      >
        {sortedMilestones.map((milestone, index) => {
          const colors = TYPE_COLORS[milestone.type] || TYPE_COLORS.system
          const isCurrent = milestone.id === currentMilestoneId
          const isLast = index === sortedMilestones.length - 1

          return (
            <div
              key={milestone.id}
              className="flex items-center flex-shrink-0"
            >
              {/* Milestone node */}
              <button
                type="button"
                onClick={() => handleClick(milestone.id)}
                className={cn(
                  "relative flex flex-col items-center min-w-[80px] px-1 group",
                  onMilestoneClick && "cursor-pointer"
                )}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "w-3 h-3 rounded-full transition-transform group-hover:scale-125",
                    colors.bg,
                    isCurrent && "ring-2 ring-offset-2 ring-primary scale-110",
                    milestone.isImportant && "ring-2 ring-offset-1 ring-amber-400"
                  )}
                />

                {/* Label */}
                <span
                  className={cn(
                    "mt-1.5 text-[10px] font-medium truncate max-w-[70px] text-center",
                    isCurrent ? "text-foreground font-semibold" : colors.text
                  )}
                >
                  {milestone.label}
                </span>

                {/* Date */}
                <span className="text-[9px] text-muted-foreground">
                  {format(new Date(milestone.date), 'dd/MM', { locale: ptBR })}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="w-8 h-0.5 bg-border flex-shrink-0 mx-1" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
