import { StageHistory } from '@/lib/types'
import { useSupabase } from '@/hooks/useSupabase'

export function useStageHistory(playerTrackId?: string) {
  return useSupabase<StageHistory>('stage_history', {
    filter: playerTrackId ? (query) => query.eq('player_track_id', playerTrackId) : undefined,
    orderBy: { column: 'entered_at', ascending: true },
    realtime: true,
  })
}
