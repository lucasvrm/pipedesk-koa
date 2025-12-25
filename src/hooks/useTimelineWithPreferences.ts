import { useMemo } from 'react'
import { useUnifiedTimeline } from './useUnifiedTimeline'
import { useTimelinePreferences } from './useTimelinePreferences'
import { getPreferenceTypeFromItem } from '@/lib/timelineTypeMapping'
import type { TimelineItem } from '@/components/timeline-v2/types'
import type { TimelineEventType } from '@/lib/types'

interface ExtendedTimelineItem extends TimelineItem {
  customColor?: string
  preferenceType?: TimelineEventType | null
}

/**
 * Hook que aplica preferências do usuário aos eventos da timeline
 * Filtra eventos desabilitados e adiciona cores customizadas
 */
export function useTimelineWithPreferences(
  entityId: string,
  entityType: 'deal' | 'lead' | 'company'
) {
  const { items, isLoading, error, refetch } = useUnifiedTimeline(entityId, entityType)
  const { isEventEnabled, getEventColor } = useTimelinePreferences()

  // Filtrar e enriquecer items
  const enhancedItems = useMemo(() => {
    return items
      .map(item => {
        // Descobrir tipo de preferência correspondente
        const prefType = getPreferenceTypeFromItem(item)

        // FILTRO 1: Preferências (sempre aplicado)
        if (prefType && !isEventEnabled(prefType)) {
          return null // Evento desabilitado nas preferências
        }

        // Adicionar cor customizada
        const customColor = prefType ? getEventColor(prefType) : undefined

        return {
          ...item,
          customColor,
          preferenceType: prefType
        } as ExtendedTimelineItem
      })
      .filter((item): item is ExtendedTimelineItem => item !== null)
  }, [items, isEventEnabled, getEventColor])

  return {
    items: enhancedItems,
    isLoading,
    error,
    refetch
  }
}
