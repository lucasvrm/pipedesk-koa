import { useQuery } from '@tanstack/react-query'
import { SalesViewFilters } from './leadService'

export type LeadPriorityBucket = 'hot' | 'warm' | 'cold'

export interface LeadSalesViewItem {
  id?: string
  leadId?: string
  lead_id?: string
  priorityScore?: number | null
  priority_score?: number | null
  priorityDescription?: string | null
  priority_description?: string | null
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

/**
 * Validates that the response from sales-view API has the expected structure.
 * Returns true if valid, throws an error with details if invalid.
 */
function isSalesViewResponseValid(data: unknown): data is { data?: unknown[]; items?: unknown[]; pagination?: unknown; total?: number; count?: number } {
  if (data === null || typeof data !== 'object') {
    throw new Error('sales-view response is not an object')
  }

  const payload = data as Record<string, unknown>
  
  // Check if items or data exists and is an array
  const items = payload.data ?? payload.items
  if (items !== undefined && !Array.isArray(items)) {
    throw new Error(`sales-view expected items to be an array but received: ${typeof items}`)
  }

  // Check if count/total is a number when present
  const count = payload.total ?? payload.count ?? (payload.pagination as Record<string, unknown>)?.total
  if (count !== undefined && typeof count !== 'number') {
    throw new Error(`sales-view expected count to be a number but received: ${typeof count}`)
  }

  return true
}

async function fetchSalesView({ page = 1, pageSize = 10, ...filters }: LeadSalesViewQuery): Promise<LeadSalesViewResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    order_by: filters.orderBy ?? 'priority'
  })

  if (filters.owner) searchParams.set('owner', filters.owner)
  if (filters.ownerIds?.length) searchParams.set('owners', filters.ownerIds.join(','))
  if (filters.priority?.length) searchParams.set('priority', filters.priority.join(','))
  if (filters.status?.length) searchParams.set('status', filters.status.join(','))
  if (filters.origin?.length) searchParams.set('origin', filters.origin.join(','))
  if (filters.daysWithoutInteraction) searchParams.set('days_without_interaction', String(filters.daysWithoutInteraction))
  const response = await fetch(`/api/leads/sales-view?${searchParams.toString()}`)

  if (!response.ok) {
    console.error('[SalesView] API request failed', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    })
    throw new Error('Falha ao carregar leads da Sales View')
  }

  // Validate content-type before parsing JSON
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    console.error('[SalesView] Expected JSON but received unexpected content-type', {
      contentType,
      url: response.url
    })
    throw new Error(
      `sales-view expected JSON but received: ${contentType ?? 'unknown'}`
    )
  }

  const payload = await response.json()

  // Validate response structure
  isSalesViewResponseValid(payload)

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
