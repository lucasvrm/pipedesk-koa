import { useMemo } from 'react'
import type { TimelineItem, TimelineItemType } from '../types'
import type { TimelineMilestone } from '../HorizontalTimeline'

/**
 * Extracts milestones from timeline items for the horizontal timeline display.
 * Filters out system events and limits to most recent items.
 */
export function useTimelineMilestones(items: TimelineItem[], maxItems = 10): TimelineMilestone[] {
  return useMemo(() => {
    return items
      .filter(item => item.type !== 'system') // Only relevant events
      .slice(0, maxItems) // Limit quantity
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
