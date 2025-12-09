import { useQuery } from '@tanstack/react-query'

export type LeadPriorityBucket = 'hot' | 'warm' | 'cold'

export interface LeadSalesViewItem {
  id: string
  priorityScore?: number | null
  priorityBucket: LeadPriorityBucket
  legalName: string
  tradeName?: string | null
  primaryContact?: {
    name: string
    role?: string | null
    avatar?: string | null
  }
  lastInteractionAt?: string | null
  lastInteractionType?: 'email' | 'event' | null
  nextAction?: {
    code: string
    label: string
    reason?: string | null
  }
  owner?: {
    name: string
    avatar?: string | null
  }
  tags?: Array<{
    id?: string
    name: string
    color?: string | null
  }>
}

export interface LeadSalesViewResponse {
  data: LeadSalesViewItem[]
  total: number
  page: number
  pageSize: number
}

async function fetchSalesView(page: number, pageSize: number): Promise<LeadSalesViewResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize)
  })

  const response = await fetch(`/api/leads/sales-view?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Falha ao carregar leads da Sales View')
  }

  const payload = await response.json()

  return {
    data: payload.data || payload.items || [],
    total: payload.total ?? payload.count ?? 0,
    page: payload.page ?? page,
    pageSize: payload.pageSize ?? pageSize
  }
}

export function useLeadsSalesView(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['leads-sales-view', page, pageSize],
    queryFn: () => fetchSalesView(page, pageSize),
    keepPreviousData: true
  })
}
