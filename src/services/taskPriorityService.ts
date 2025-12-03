import { supabase } from '@/lib/supabaseClient'

export interface TaskPrioritySetting {
  id: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  createdAt?: string
}

function mapFromDb(item: any): TaskPrioritySetting {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    color: item.color,
    isActive: item.is_active ?? true,
    createdAt: item.created_at,
  }
}

function mapToDb(item: Partial<TaskPrioritySetting>) {
  return {
    name: item.name,
    description: item.description,
    color: item.color,
    is_active: item.isActive,
  }
}

async function getTaskPriorities(): Promise<TaskPrioritySetting[]> {
  const { data, error } = await supabase
    .from('task_priorities')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapFromDb)
}

async function createTaskPriority(data: Partial<TaskPrioritySetting>): Promise<TaskPrioritySetting> {
  const payload = mapToDb({ ...data, isActive: data.isActive ?? true })
  const { data: created, error } = await supabase
    .from('task_priorities')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(created)
}

async function updateTaskPriority(id: string, data: Partial<TaskPrioritySetting>): Promise<TaskPrioritySetting> {
  const payload = mapToDb(data)
  const { data: updated, error } = await supabase
    .from('task_priorities')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapFromDb(updated)
}

async function deleteTaskPriority(id: string): Promise<void> {
  const { error } = await supabase.from('task_priorities').delete().eq('id', id)
  if (error) throw error
}

async function toggleTaskPriority(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('task_priorities')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export const taskPriorityService = {
  list: getTaskPriorities,
  create: createTaskPriority,
  update: updateTaskPriority,
  remove: deleteTaskPriority,
  toggleActive: toggleTaskPriority,
}

export type TaskPriorityService = typeof taskPriorityService
