import { supabase } from '@/lib/supabaseClient'

export interface TaskStatusSetting {
  id: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  createdAt?: string
}

function mapFromDb(item: any): TaskStatusSetting {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    color: item.color,
    isActive: item.is_active ?? true,
    createdAt: item.created_at,
  }
}

function mapToDb(item: Partial<TaskStatusSetting>) {
  return {
    name: item.name,
    description: item.description,
    color: item.color,
    is_active: item.isActive,
  }
}

async function getTaskStatuses(): Promise<TaskStatusSetting[]> {
  const { data, error } = await supabase
    .from('task_statuses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapFromDb)
}

async function createTaskStatus(data: Partial<TaskStatusSetting>): Promise<TaskStatusSetting> {
  const payload = mapToDb({ ...data, isActive: data.isActive ?? true })
  const { data: created, error } = await supabase
    .from('task_statuses')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(created)
}

async function updateTaskStatus(id: string, data: Partial<TaskStatusSetting>): Promise<TaskStatusSetting> {
  const payload = mapToDb(data)
  const { data: updated, error } = await supabase
    .from('task_statuses')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(updated)
}

async function deleteTaskStatus(id: string): Promise<void> {
  const { error } = await supabase.from('task_statuses').delete().eq('id', id)
  if (error) throw error
}

async function toggleTaskStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('task_statuses')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export const taskStatusService = {
  list: getTaskStatuses,
  create: createTaskStatus,
  update: updateTaskStatus,
  remove: deleteTaskStatus,
  toggleActive: toggleTaskStatus,
}

export type TaskStatusService = typeof taskStatusService
