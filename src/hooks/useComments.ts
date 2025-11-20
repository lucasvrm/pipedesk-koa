import { Comment } from '@/lib/types'
import { useSupabase } from './useSupabase'

export function useComments(entityId?: string, entityType?: 'deal' | 'track' | 'task') {
  return useSupabase<Comment>('comments', {
    filter:
      entityId && entityType
        ? (query) => query.eq('entity_id', entityId).eq('entity_type', entityType)
        : undefined,
    orderBy: { column: 'created_at', ascending: true },
    realtime: true,
  })
}
