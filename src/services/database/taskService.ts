import { supabase } from '@/lib/supabaseClient'
import { Task } from '@/lib/types'

export const taskService = {
  async getTasksByTrackId(trackId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('player_track_id', trackId)
      .order('position', { ascending: true })

    if (error) throw error
    return data as Task[]
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        player_track_id: task.playerTrackId,
        due_date: task.dueDate,
        is_milestone: task.isMilestone,
      })
      .select()
      .single()

    if (error) throw error
    return data as Task
  },

  async updateTask(id: string, updates: Partial<Task>) {
    const dbUpdates: any = { ...updates }
    if (updates.playerTrackId) dbUpdates.player_track_id = updates.playerTrackId
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate
    if (updates.isMilestone) dbUpdates.is_milestone = updates.isMilestone

    delete dbUpdates.playerTrackId
    delete dbUpdates.dueDate
    delete dbUpdates.isMilestone
    delete dbUpdates.createdAt
    delete dbUpdates.updatedAt

    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Task
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
