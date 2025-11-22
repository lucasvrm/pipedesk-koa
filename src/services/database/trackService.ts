import { supabase } from '@/lib/supabaseClient'
import { PlayerTrack } from '@/lib/types'

export const trackService = {
  async getTracksByDealId(dealId: string) {
    const { data, error } = await supabase
      .from('player_tracks')
      .select('*')
      .eq('master_deal_id', dealId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as PlayerTrack[]
  },

  async createTrack(track: Omit<PlayerTrack, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('player_tracks')
      .insert({
        ...track,
        master_deal_id: track.masterDealId,
        player_name: track.playerName,
        track_volume: track.trackVolume,
        current_stage: track.currentStage,
      })
      .select()
      .single()

    if (error) throw error
    return data as PlayerTrack
  },

  async updateTrack(id: string, updates: Partial<PlayerTrack>) {
    const dbUpdates: any = { ...updates }
    if (updates.masterDealId) dbUpdates.master_deal_id = updates.masterDealId
    if (updates.playerName) dbUpdates.player_name = updates.playerName
    if (updates.trackVolume) dbUpdates.track_volume = updates.trackVolume
    if (updates.currentStage) dbUpdates.current_stage = updates.currentStage

    delete dbUpdates.masterDealId
    delete dbUpdates.playerName
    delete dbUpdates.trackVolume
    delete dbUpdates.currentStage
    delete dbUpdates.createdAt
    delete dbUpdates.updatedAt

    const { data, error } = await supabase
      .from('player_tracks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as PlayerTrack
  },

  async deleteTrack(id: string) {
    const { error } = await supabase
      .from('player_tracks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
