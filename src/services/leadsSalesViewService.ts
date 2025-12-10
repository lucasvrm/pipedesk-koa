import { useQuery } from '@tanstack/react-query'
import { SalesViewFilters } from './leadService'

export type LeadPriorityBucket = 'hot' | 'warm' | 'cold'

export interface LeadSalesViewItem {
  id?: string
  leadId?: string
  lead_id?: string
  priorityScore?: number | null
  priority_score?: number | null
  priorityBucket?: LeadPriorityBucket
  priority_bucket?: LeadPriorityBucket
  legalName?: string
  legal_name?: string
  tradeName?: string | null
  trade_name?: string | null
  primaryContact?: {
    name: string
    role?: string | null
    avatar?: string | null
  }
  primary_contact?: {
    name: string
    role?: string | null
    avatar?: string | null
  }
  lastInteractionAt?: string | null
  last_interaction_at?: string | null
  lastInteractionType?: 'email' | 'event' | null
  last_interaction_type?: 'email' | 'event' | null
  nextAction?: {
    code: string
    label: string
    reason?: string | null
  }
  next_action?: {
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

export interface LeadSalesViewPagination {
  total: number
  page: number
  perPage: number
}

export interface LeadSalesViewResponse {
  data: LeadSalesViewItem[]
  pagination: LeadSalesViewPagination
}

export interface LeadSalesViewQuery extends SalesViewFilters {
  page?: number
  pageSize?: number
}

async function fetchSalesView({ page = 1, pageSize = 10, ...filters }: LeadSalesViewQuery): Promise<LeadSalesViewResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize)
  })

  if (filters.owner) searchParams.set('owner', filters.owner)
  if (filters.ownerIds?.length) searchParams.set('owners', filters.ownerIds.join(','))
  if (filters.priority?.length) searchParams.set('priority', filters.priority.join(','))
  if (filters.status?.length) searchParams.set('status', filters.status.join(','))
  if (filters.origin?.length) searchParams.set('origin', filters.origin.join(','))
  if (filters.daysWithoutInteraction) searchParams.set('days_without_interaction', String(filters.daysWithoutInteraction))
  if (filters.orderBy) searchParams.set('order_by', filters.orderBy)

  const response = await fetch(`/api/leads/sales-view?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error('Falha ao carregar leads da Sales View')
  }

  const payload = await response.json()

  return {
    data: payload.data ?? payload.items ?? [],
    pagination: {
      total: payload.pagination?.total ?? payload.total ?? payload.count ?? payload.meta?.total ?? 0,
      page: payload.pagination?.page ?? payload.page ?? payload.meta?.page ?? page,
      perPage: payload.pagination?.per_page ?? payload.pagination?.perPage ?? payload.pageSize ?? payload.meta?.perPage ?? pageSize
    }
  }
}

export function useLeadsSalesView(params: LeadSalesViewQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['leads-sales-view', params],
    queryFn: () => fetchSalesView(params),
    keepPreviousData: true,
    enabled: options?.enabled ?? true
  })
}
