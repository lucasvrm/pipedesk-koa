import { Folder, EntityLocation } from '@/lib/types'
import { useSupabase } from './useSupabase'

export function useFolders() {
  return useSupabase<Folder>('folders', {
    orderBy: { column: 'position', ascending: true },
    realtime: true,
  })
}

export function useEntityLocations(entityId?: string, entityType?: 'deal' | 'track' | 'task') {
  return useSupabase<EntityLocation>('entity_locations', {
    filter:
      entityId && entityType
        ? (query) => query.eq('entity_id', entityId).eq('entity_type', entityType)
        : undefined,
    realtime: true,
  })
}
