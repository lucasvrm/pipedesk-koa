import { apiClient } from '@/lib/apiClient'

export interface LeadTask {
  id: string
  lead_id: string
  template_id: string | null
  template_code: string | null
  title: string
  description: string | null
  is_next_action: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
  sort_order: number
  completed_at: string | null
  completed_by: string | null
  created_at: string
  created_by: string | null
}

export interface LeadTaskListResponse {
  data: LeadTask[]
  total: number
  next_action: LeadTask | null
}

export interface CreateLeadTaskRequest {
  title: string
  description?: string
  is_next_action?: boolean
  due_date?: string
}

export interface CreateFromTemplateRequest {
  template_id: string
  is_next_action?: boolean
  due_date?: string
}

// Listar tarefas do lead
export async function listLeadTasks(
  leadId: string,
  includeCompleted = false
): Promise<LeadTaskListResponse> {
  const params = new URLSearchParams()
  if (includeCompleted) params.set('include_completed', 'true')
  
  const response = await apiClient.get<LeadTaskListResponse>(
    `/leads/${leadId}/tasks?${params}`
  )
  return response
}

// Criar tarefa customizada
export async function createLeadTask(
  leadId: string,
  data: CreateLeadTaskRequest
): Promise<LeadTask> {
  const response = await apiClient.post<LeadTask>(
    `/leads/${leadId}/tasks`,
    data
  )
  return response
}

// Criar tarefa a partir de template
export async function createLeadTaskFromTemplate(
  leadId: string,
  data: CreateFromTemplateRequest
): Promise<LeadTask> {
  const response = await apiClient.post<LeadTask>(
    `/leads/${leadId}/tasks/from-template`,
    data
  )
  return response
}

// Completar tarefa
export async function completeLeadTask(
  leadId: string,
  taskId: string
): Promise<LeadTask> {
  const response = await apiClient.post<LeadTask>(
    `/leads/${leadId}/tasks/${taskId}/complete`
  )
  return response
}

// Definir como próxima ação
export async function setTaskAsNextAction(
  leadId: string,
  taskId: string
): Promise<LeadTask> {
  const response = await apiClient.patch<LeadTask>(
    `/leads/${leadId}/tasks/${taskId}/set-next-action`
  )
  return response
}

// Deletar tarefa
export async function deleteLeadTask(
  leadId: string,
  taskId: string
): Promise<void> {
  await apiClient.delete(`/leads/${leadId}/tasks/${taskId}`)
}
