import { useMemo } from 'react'
import type { TimelineItem, TimelineFilterState } from '../types'

/**
 * Filters timeline items based on search query and selected types.
 * activeTypes is an array - if empty, shows all items.
 */
export function useTimelineFilter(
  items: TimelineItem[],
  filterState: TimelineFilterState
) {
  const filteredItems = useMemo(() => {
    let result = items

    // Filter by type (multiselect)
    if (filterState.activeTypes.length > 0) {
      result = result.filter(item => filterState.activeTypes.includes(item.type))
    }

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
