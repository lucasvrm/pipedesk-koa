import { useMemo } from 'react'
import type { TimelineItem, TimelineFilterState } from '../types'

/**
 * Hook to filter timeline items based on filter state.
 * Supports filtering by type (all, comment, communication, system) and search query.
 */
export function useTimelineFilter(items: TimelineItem[], filterState: TimelineFilterState) {
  const filteredItems = useMemo(() => {
    let result = items
    
    // Filter by type
    if (filterState.activeFilter !== 'all') {
      if (filterState.activeFilter === 'comment') {
        result = result.filter(item => item.type === 'comment')
      } else if (filterState.activeFilter === 'communication') {
        result = result.filter(item => 
          item.type === 'email' || item.type === 'meeting'
        )
      } else if (filterState.activeFilter === 'system') {
        result = result.filter(item => 
          item.type === 'system' || item.type === 'audit'
        )
      }
    }
    
    // Filter by search query
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase()
      result = result.filter(item => 
        item.content.toLowerCase().includes(query) ||
        item.author.name.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query)
      )
    }
    
    return result
  }, [items, filterState])
  
  return { filteredItems, filterState }
}
