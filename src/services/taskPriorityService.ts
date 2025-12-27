import { supabase } from '@/lib/supabaseClient'
import { TaskPriorityDefinition } from '@/lib/types'

export interface TaskPriorityInput {
  name: string
  description?: string
  isActive?: boolean
}

function mapFromDb(item: any): TaskPriorityDefinition {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

function mapToDb(data: TaskPriorityInput) {
  return {
    name: data.name,
    description: data.description,
    is_active: data.isActive ?? true
  }
}

export const taskPriorityService = {
  async getTaskPriorities(): Promise<TaskPriorityDefinition[]> {
    const { data, error } = await supabase
      .from('task_priorities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapFromDb)
  },

  async createTaskPriority(payload: TaskPriorityInput): Promise<TaskPriorityDefinition> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('task_priorities') as any)
      .insert(mapToDb(payload))
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async updateTaskPriority(id: string, payload: TaskPriorityInput): Promise<TaskPriorityDefinition> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('task_priorities') as any)
      .update(mapToDb(payload))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapFromDb(data)
  },

  async deleteTaskPriority(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_priorities')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleTaskPriority(id: string, isActive: boolean): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('task_priorities') as any)
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }
}
