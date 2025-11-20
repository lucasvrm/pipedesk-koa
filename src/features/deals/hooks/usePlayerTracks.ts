import { PlayerTrack } from '@/lib/types'
import { useSupabase } from '@/hooks/useSupabase'

export function usePlayerTracks(masterDealId?: string) {
  return useSupabase<PlayerTrack>('player_tracks', {
    filter: masterDealId
      ? (query) => query.eq('master_deal_id', masterDealId)
      : undefined,
    orderBy: { column: 'created_at', ascending: false },
    realtime: true,
  })
}
