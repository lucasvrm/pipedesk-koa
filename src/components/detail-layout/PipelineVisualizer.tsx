import { cn } from '@/lib/utils'
import { Check } from '@phosphor-icons/react'

export interface PipelineStage {
  id: string
  label: string
  color?: string
}

interface PipelineVisualizerProps {
  stages: PipelineStage[]
  currentStageId: string
  onStageClick?: (stageId: string) => void
  className?: string
  readOnly?: boolean
}

export function PipelineVisualizer({
  stages,
  currentStageId,
  onStageClick,
  className,
  readOnly = false
}: PipelineVisualizerProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStageId)

  return (
    <div className={cn("w-full overflow-x-auto pb-2 scrollbar-hide", className)}>
      <div className="flex items-center min-w-max">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div
              key={stage.id}
              className={cn(
                "relative flex items-center h-10 px-4 select-none transition-colors",
                // Chevron shape logic using CSS clip-path or pseudo-elements is complex for tailwind-only without custom plugins.
                // Using a simpler "Segmented Progress" look or simple arrow separators for robustness.
                "first:pl-4 first:rounded-l-md last:rounded-r-md border-r border-white/20 mr-1",
                isCompleted ? "bg-green-600 text-white cursor-pointer hover:bg-green-700" :
                isCurrent ? "bg-blue-600 text-white font-bold shadow-md scale-105 z-10 rounded-md mx-1" :
                "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer",
                readOnly && "cursor-default pointer-events-none"
              )}
              onClick={() => !readOnly && onStageClick && onStageClick(stage.id)}
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                {isCompleted && <Check weight="bold" className="h-4 w-4" />}
                <span className="text-sm">{stage.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
