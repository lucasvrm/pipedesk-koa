import { TIMELINE_EVENT_LABELS } from '@/constants/timeline'
import type { TimelineEventType } from '@/lib/types'
import type { TimelineItemType } from '@/hooks/useUnifiedTimeline'

/**
 * Mapa de tipos de preferência → tipos da timeline
 * Usado para filtrar eventos e aplicar cores customizadas
 */
export const PREFERENCE_TO_TIMELINE_MAP: Record<
  TimelineEventType,
  { 
    timelineTypes: TimelineItemType[]
    metadataCheck?: (metadata: any) => boolean
  }
> = {
  // Implementados (7 tipos)
  status_change: {
    timelineTypes: ['audit', 'system'],
    metadataCheck: (m) => m?.field === 'status' || m?.action === 'status_change'
  },
  comments: {
    timelineTypes: ['comment'],
    metadataCheck: (m) => !m?.mentions || m.mentions.length === 0
  },
  mentions: {
    timelineTypes: ['comment'],
    metadataCheck: (m) => m?.mentions && m.mentions.length > 0
  },
  assignment: {
    timelineTypes: ['audit', 'system'],
    metadataCheck: (m) => m?.field === 'owner' || m?.action === 'owner_change'
  },
  task_completed: {
    timelineTypes: ['system'],
    metadataCheck: (m) => m?.taskId !== undefined
  },
  notes: {
    timelineTypes: ['comment'],
    metadataCheck: (m) => m?.isNote === true
  },
  file_upload: {
    timelineTypes: ['system', 'audit'],
    metadataCheck: (m) => m?.action === 'file_upload'
  },

  // Futuros (4 tipos - não implementados ainda)
  priority_change: { 
    timelineTypes: ['audit'] 
  },
  contact_associated: { 
    timelineTypes: ['audit'] 
  },
  loss_reason: { 
    timelineTypes: ['audit'] 
  },
  calendar_event: { 
    timelineTypes: ['meeting'] 
  }
}

/**
 * Dado um TimelineItem, retorna qual TimelineEventType corresponde
 * Retorna null se não encontrar correspondência
 */
export function getPreferenceTypeFromItem(item: {
  type: TimelineItemType
  metadata?: any
}): TimelineEventType | null {
  for (const [prefType, config] of Object.entries(PREFERENCE_TO_TIMELINE_MAP)) {
    // Verificar se tipo da timeline corresponde
    if (!config.timelineTypes.includes(item.type)) {
      continue
    }

    // Se tem metadataCheck, aplicar
    if (config.metadataCheck && !config.metadataCheck(item.metadata)) {
      continue
    }

    return prefType as TimelineEventType
  }

  return null
}

/**
 * Agrupa TimelineEventTypes habilitados por TimelineItemType
 * Usado para renderizar toggles corretos no TimelineHeader
 */
export function groupEnabledEventsByTimelineType(
  enabledEvents: Record<TimelineEventType, boolean>
): Map<TimelineItemType, TimelineEventType[]> {
  const grouped = new Map<TimelineItemType, TimelineEventType[]>()

  Object.entries(PREFERENCE_TO_TIMELINE_MAP).forEach(([prefType, config]) => {
    const eventType = prefType as TimelineEventType

    if (!enabledEvents[eventType]) {
      return
    }

    config.timelineTypes.forEach(timelineType => {
      if (!grouped.has(timelineType)) {
        grouped.set(timelineType, [])
      }

      const current = grouped.get(timelineType)!
      if (!current.includes(eventType)) {
        current.push(eventType)
      }
    })
  })

  return grouped
}

/**
 * Retorna label descritivo para um TimelineItemType
 * baseado nos eventos de preferência que ele representa
 */
export function getLabelForTimelineType(
  timelineType: TimelineItemType,
  eventTypes: TimelineEventType[]
): string {
  if (eventTypes.length === 0) return ''

  if (eventTypes.length === 1) {
    return TIMELINE_EVENT_LABELS[eventTypes[0]] ?? timelineType
  }

  const genericLabels: Record<TimelineItemType, string> = {
    comment: 'Comentários',
    email: 'Emails',
    meeting: 'Reuniões',
    audit: 'Alterações',
    system: 'Sistema'
  }

  return genericLabels[timelineType] ?? timelineType
}
