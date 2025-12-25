import { useMemo } from 'react'
import type { TimelineItem, TimelineFilterState, TimelineItemType } from '../types'
import type { TimelineEventType } from '@/lib/types'
import { getPreferenceTypeFromItem } from '@/lib/timelineTypeMapping'

/**
 * Filters timeline items based on search query and selected types.
 * 
 * Lógica:
 * - activeTypes vazio ([]) = mostra NENHUM item (timeline vazia)
 * - activeTypes com valores = mostra apenas os tipos selecionados
 * - granularFilter aplica filtro adicional por evento específico
 */
export function useTimelineFilter(
  items: TimelineItem[],
  filterState: TimelineFilterState,
  granularFilter: Record<TimelineItemType, TimelineEventType[]> = {}
) {
  const filteredItems = useMemo(() => {
    // Se nenhum tipo selecionado, retorna array vazio
    if (filterState.activeTypes.length === 0) {
      return []
    }

    let result = items

    // Filter by type (multiselect)
    result = result.filter(item => 
      filterState.activeTypes.includes(item.type)
    )

    // Filtro granular por evento de preferência
    result = result.filter(item => {
      const eventType = getPreferenceTypeFromItem(item)
      if (!eventType) return true // Se não mapeia, mostrar
      
      const allowedEvents = granularFilter[item.type] || []
      // Se não há filtro granular para este tipo, mostrar todos
      if (allowedEvents.length === 0) return true
      
      return allowedEvents.includes(eventType)
    })

    // Filter by search query
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase()
      result = result.filter(item => {
        const contentMatch = item.content.toLowerCase().includes(query)
        const authorMatch = item.author.name.toLowerCase().includes(query)
        const titleMatch = item.title?.toLowerCase().includes(query)
        return contentMatch || authorMatch || titleMatch
      })
    }

    return result
  }, [items, filterState, granularFilter])

  return { filteredItems }
}
