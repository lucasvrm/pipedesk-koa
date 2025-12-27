import { supabase } from '@/lib/supabaseClient'
import { TaskStatusDefinition } from '@/lib/types'

export interface TaskStatusInput {
  name: string
  description?: string
  isActive?: boolean
}

function mapFromDb(item: any): TaskStatusDefinition {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

function mapToDb(data: TaskStatusInput) {
  return {
    name: data.name,
    description: data.description,
    is_active: data.isActive ?? true
  }
}

export const taskStatusService = {
  async getTaskStatuses(): Promise<TaskStatusDefinition[]> {
    const { data, error } = await supabase
      .from('task_statuses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapFromDb)
  },

  async createTaskStatus(payload: TaskStatusInput): Promise<TaskStatusDefinition> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('task_statuses') as any)
      .insert(mapToDb(payload))
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async updateTaskStatus(id: string, payload: TaskStatusInput): Promise<TaskStatusDefinition> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('task_statuses') as any)
      .update(mapToDb(payload))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async deleteTaskStatus(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_statuses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleTaskStatus(id: string, isActive: boolean): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('task_statuses') as any)
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }
}
