import { Task } from '@/lib/types'
import { useSupabase } from '@/hooks/useSupabase'

export function useTasks(playerTrackId?: string) {
  return useSupabase<Task>('tasks', {
    filter: playerTrackId
      ? (query) => query.eq('player_track_id', playerTrackId)
      : undefined,
    orderBy: { column: 'position', ascending: true },
    realtime: true,
  })
}
