import { apiClient } from '@/lib/apiClient'

export interface LeadTaskTemplate {
  id: string
  code: string
  label: string
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface LeadTaskTemplateCreate {
  code: string
  label: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface LeadTaskTemplateUpdate {
  code?: string
  label?: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

export interface LeadTaskTemplateListResponse {
  data: LeadTaskTemplate[]
  total: number
}

export async function listLeadTaskTemplates(
  includeInactive = false
): Promise<LeadTaskTemplateListResponse> {
  const params = new URLSearchParams()
  if (includeInactive) params.set('include_inactive', 'true')
  
  const response = await apiClient.get<LeadTaskTemplateListResponse>(
    `/lead-task-templates?${params}`
  )
  return response
}

export async function getLeadTaskTemplate(id: string): Promise<LeadTaskTemplate> {
  const response = await apiClient.get<LeadTaskTemplate>(
    `/lead-task-templates/${id}`
  )
  return response
}

export async function createLeadTaskTemplate(
  data: LeadTaskTemplateCreate
): Promise<LeadTaskTemplate> {
  const response = await apiClient.post<LeadTaskTemplate>(
    '/lead-task-templates',
    data
  )
  return response
}

export async function updateLeadTaskTemplate(
  id: string,
  data: LeadTaskTemplateUpdate
): Promise<LeadTaskTemplate> {
  const response = await apiClient.patch<LeadTaskTemplate>(
    `/lead-task-templates/${id}`,
    data
  )
  return response
}

export async function deleteLeadTaskTemplate(id: string): Promise<void> {
  await apiClient.delete(`/lead-task-templates/${id}`)
}
