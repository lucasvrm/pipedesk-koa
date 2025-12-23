import { apiFetch } from '@/lib/apiClient'

export type PriorityBucket = 'hot' | 'warm' | 'cold'

export interface UpdatePriorityResponse {
  lead_id: string
  priority_bucket: PriorityBucket
  priority_score: number
  updated_at: string
}

export async function updateLeadPriority(
  leadId: string,
  priorityBucket: PriorityBucket
): Promise<UpdatePriorityResponse> {
  return apiFetch<UpdatePriorityResponse>(
    `/leads/${leadId}/priority`,
    {
      method: 'PATCH',
      body: JSON.stringify({ priority_bucket: priorityBucket })
    }
  )
}
