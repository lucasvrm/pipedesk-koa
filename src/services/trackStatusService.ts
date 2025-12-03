import { supabase } from '@/lib/supabaseClient'

export interface TrackStatus {
  id: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  createdAt?: string
}

function mapFromDb(item: any): TrackStatus {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    color: item.color,
    isActive: item.is_active ?? true,
    createdAt: item.created_at
  }
}

function mapToDb(item: Partial<TrackStatus>) {
  return {
    name: item.name,
    description: item.description,
    color: item.color,
    is_active: item.isActive
  }
}

async function getTrackStatuses(): Promise<TrackStatus[]> {
  const { data, error } = await supabase
    .from('track_statuses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapFromDb)
}

async function createTrackStatus(data: Partial<TrackStatus>): Promise<TrackStatus> {
  const payload = mapToDb({ ...data, isActive: data.isActive ?? true })
  const { data: created, error } = await supabase
    .from('track_statuses')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(created)
}

async function updateTrackStatus(id: string, data: Partial<TrackStatus>): Promise<TrackStatus> {
  const payload = mapToDb(data)
  const { data: updated, error } = await supabase
    .from('track_statuses')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(updated)
}

async function deleteTrackStatus(id: string): Promise<void> {
  const { error } = await supabase.from('track_statuses').delete().eq('id', id)
  if (error) throw error
}

async function toggleTrackStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('track_statuses')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export const trackStatusService = {
  list: getTrackStatuses,
  create: createTrackStatus,
  update: updateTrackStatus,
  remove: deleteTrackStatus,
  toggleActive: toggleTrackStatus,
}

export type TrackStatusService = typeof trackStatusService
