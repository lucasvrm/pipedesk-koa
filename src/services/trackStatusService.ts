import { supabase } from '@/lib/supabaseClient'
import { TrackStatus } from '@/lib/types'

export interface TrackStatusInput {
  name: string
  description?: string
  isActive?: boolean
}

function mapFromDb(item: any): TrackStatus {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

function mapToDb(data: TrackStatusInput) {
  return {
    name: data.name,
    description: data.description,
    is_active: data.isActive ?? true
  }
}

export const trackStatusService = {
  async getTrackStatuses(): Promise<TrackStatus[]> {
    const { data, error } = await supabase
      .from('track_statuses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapFromDb)
  },

  async createTrackStatus(payload: TrackStatusInput): Promise<TrackStatus> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('track_statuses') as any)
      .insert(mapToDb(payload))
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async updateTrackStatus(id: string, payload: TrackStatusInput): Promise<TrackStatus> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('track_statuses') as any)
      .update(mapToDb(payload))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async deleteTrackStatus(id: string): Promise<void> {
    const { error } = await supabase
      .from('track_statuses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleTrackStatus(id: string, isActive: boolean): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('track_statuses') as any)
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }
}
