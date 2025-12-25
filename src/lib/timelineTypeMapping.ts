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
