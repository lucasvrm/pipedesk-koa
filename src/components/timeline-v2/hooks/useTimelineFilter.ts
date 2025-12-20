import { useMemo } from 'react'
import type { TimelineItem, TimelineFilterState } from '../types'

/**
 * Filters timeline items based on search query and selected types.
 * 
 * Lógica:
 * - activeTypes vazio ([]) = mostra NENHUM item (timeline vazia)
 * - activeTypes com valores = mostra apenas os tipos selecionados
 */
export function useTimelineFilter(
  items: TimelineItem[],
  filterState: TimelineFilterState
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
  }, [items, filterState])

  return { filteredItems }
}
