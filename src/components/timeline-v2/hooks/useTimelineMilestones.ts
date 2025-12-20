import { useMemo } from 'react'
import type { TimelineItem, TimelineItemType } from '../types'
import type { TimelineMilestone } from '../HorizontalTimeline'

/**
 * Extracts milestones from timeline items for the horizontal timeline display.
 * Returns all items - filtering is done by the parent component based on activeTypes.
 */
export function useTimelineMilestones(items: TimelineItem[], maxItems = 15): TimelineMilestone[] {
  return useMemo(() => {
    return items
      .slice(0, maxItems)
      .map(item => ({
        id: item.id,
        label: getMilestoneLabel(item.type),
        date: item.date,
        type: item.type,
        isImportant: isImportantEvent(item)
      }))
  }, [items, maxItems])
}

function getMilestoneLabel(type: TimelineItemType): string {
  const labels: Record<TimelineItemType, string> = {
    comment: 'Comentário',
    email: 'Email',
    meeting: 'Reunião',
    audit: 'Alteração',
    system: 'Sistema'
  }
  return labels[type]
}

function isImportantEvent(item: TimelineItem): boolean {
  const lowerContent = item.content.toLowerCase()
  return (
    lowerContent.includes('fechou') ||
    lowerContent.includes('concluiu') ||
    lowerContent.includes('ganhou') ||
    lowerContent.includes('perdeu') ||
    lowerContent.includes('qualificou') ||
    (lowerContent.includes('status') &&
      (lowerContent.includes('fechado') ||
       lowerContent.includes('ganho') ||
       lowerContent.includes('perdido')))
  )
}
