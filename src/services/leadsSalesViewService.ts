import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { SalesViewFilters } from './leadService'
import { ApiError } from '@/lib/errors'

export type LeadPriorityBucket = 'hot' | 'warm' | 'cold'

export interface LeadSalesViewItem {
  id?: string
  leadId?: string
  lead_id?: string
  lead?: {
    id: string
    legal_name?: string
    trade_name?: string | null
    status?: string | null
    origin?: string | null
    created_at?: string | null
    owner?: {
      name?: string
      avatar_url?: string | null
    } | null
  }
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
    email?: string | null
    phone?: string | null
  }
  primary_contact?: {
    name: string
    role?: string | null
    avatar?: string | null
    email?: string | null
    phone?: string | null
  }
  status?: string | null
  origin?: string | null
  createdAt?: string | null
  created_at?: string | null
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
  owner_id?: string | null
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
 * Throws an error with details if invalid.
 */
function validateSalesViewResponse(data: unknown): void {
  if (data === null || typeof data !== 'object') {
    console.error('[SalesView] Invalid response: not an object', data)
    throw new Error('Resposta inválida do servidor')
  }

  const payload = data as Record<string, unknown>
  
  // Check if items or data exists and is an array
  const items = payload.data ?? payload.items
  if (items !== undefined && !Array.isArray(items)) {
    console.error('[SalesView] Invalid response: items is not an array', { items, type: typeof items })
    throw new Error('Formato de dados inválido recebido do servidor')
  }

  // Check if count/total is a number when present
  const pagination = payload.pagination
  const paginationTotal = pagination != null && typeof pagination === 'object' 
    ? (pagination as Record<string, unknown>).total 
    : undefined
  const count = payload.total ?? payload.count ?? paginationTotal
  if (count !== undefined && typeof count !== 'number') {
    console.error('[SalesView] Invalid response: count is not a number', { count, type: typeof count })
    throw new Error('Formato de paginação inválido recebido do servidor')
  }
}

async function fetchSalesView({ page = 1, pageSize = 10, ...filters }: LeadSalesViewQuery): Promise<LeadSalesViewResponse> {
  try {
    const normalizedOrderBy =
      filters.orderBy === 'last_interaction' || filters.orderBy === 'created_at' ? filters.orderBy : 'priority'

    const searchParams = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      order_by: normalizedOrderBy
    })

    if (filters.owner === 'me') searchParams.set('owner', filters.owner)
    if (filters.ownerIds?.length) searchParams.set('ownerIds', filters.ownerIds.join(','))
    if (filters.priority?.length) searchParams.set('priority', filters.priority.join(','))
    if (filters.status?.length) searchParams.set('status', filters.status.join(','))
    if (filters.origin?.length) searchParams.set('origin', filters.origin.join(','))
    if (typeof filters.daysWithoutInteraction === 'number') searchParams.set('days_without_interaction', String(filters.daysWithoutInteraction))
    
    const url = `/api/leads/sales-view?${searchParams.toString()}`
    const response = await fetch(url)

    // Validate content-type before parsing JSON to handle non-JSON error responses (e.g. 500 HTML)
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (!response.ok) {
      console.error('[SalesView] API request failed', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        contentType
      })

      // If it's JSON, try to parse error details, otherwise throw generic error
      if (isJson) {
        try {
          const errorData = await response.json()
          // Extract structured error fields from backend response
          const errorMessage = errorData.error || errorData.message || 'Não foi possível carregar a visão de vendas'
          const errorCode = errorData.code
          const errorDetails = errorData.details
          
          console.error('[SalesView] Error details:', { errorMessage, errorCode, errorDetails })
          
          throw new ApiError(
            errorMessage,
            response.status,
            url,
            errorCode,
            errorDetails
          )
        } catch (e) {
          // Fallback if parsing fails despite header (e.g., malformed JSON)
          if (e instanceof Error && !(e instanceof ApiError)) {
            console.error('[SalesView] Failed to parse error response:', e)
          } else {
            // Re-throw ApiError
            throw e
          }
        }
      }

      throw new ApiError(
        'Não foi possível carregar a visão de vendas',
        response.status,
        url
      )
    }

    if (!isJson) {
      console.error('[SalesView] Expected JSON but received unexpected content-type', {
        contentType,
        url: response.url
      })
      throw new Error(
        'Resposta inválida do servidor. Por favor, tente novamente.'
      )
    }

    const payload = await response.json()

    // Validate response structure
    validateSalesViewResponse(payload)

    return {
      data: payload.data ?? payload.items ?? [],
      pagination: {
        total: payload.pagination?.total ?? payload.total ?? payload.count ?? payload.meta?.total ?? 0,
        page: payload.pagination?.page ?? payload.page ?? payload.meta?.page ?? page,
        perPage: payload.pagination?.per_page ?? payload.pagination?.perPage ?? payload.pageSize ?? payload.meta?.perPage ?? pageSize
      }
    }
  } catch (error) {
    // Re-throw with normalized error message
    if (error instanceof Error) {
      console.error('[SalesView] Error fetching sales view:', error.message)
      throw error
    }
    // Handle non-Error objects (network failures, etc.)
    console.error('[SalesView] Unknown error:', error)
    throw new Error('Ocorreu um erro inesperado ao carregar a visão de vendas')
  }
}

export function useLeadsSalesView(params: LeadSalesViewQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['leads-sales-view', params],
    queryFn: () => fetchSalesView(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })
}
