import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export interface LeadMonthlyMetrics {
  createdThisMonth: number
  qualifiedThisMonth: number
}

/**
 * Filter options for monthly metrics query.
 * This is a subset of SalesViewFilters that applies to count queries.
 */
interface MetricsFilters {
  owner?: 'me' | 'all' | string
  ownerIds?: string[]
  status?: string[]
  origin?: string[]
}

/**
 * Returns the start of the current month in UTC as ISO string
 */
function getStartOfMonthUtc(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString()
}

/**
 * Returns the start of the next month in UTC as ISO string (exclusive upper bound)
 */
function getStartOfNextMonthUtc(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0)).toISOString()
}

interface UseLeadMonthlyMetricsParams {
  filters?: MetricsFilters
  enabled?: boolean
}

/**
 * Hook to fetch lead monthly metrics (created/qualified this month).
 * These counts are fetched directly from Supabase to ensure accuracy
 * regardless of pagination or list filtering.
 * 
 * NOTE: The "qualified this month" count intentionally includes leads
 * that are qualified (even if the main list excludes them by default).
 */
export function useLeadMonthlyMetrics({ filters, enabled = true }: UseLeadMonthlyMetricsParams = {}) {
  const { profile } = useAuth()
  const startOfMonth = getStartOfMonthUtc()
  const startOfNextMonth = getStartOfNextMonthUtc()

  return useQuery({
    queryKey: ['lead-monthly-metrics', startOfMonth, filters],
    queryFn: async (): Promise<LeadMonthlyMetrics> => {
      // Base query for created_at count
      let createdQuery = supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth)

      // Base query for qualified_at count
      // NOTE: This counts all leads qualified this month, including those
      // that may be excluded from the main list (by design per requirements)
      let qualifiedQuery = supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('qualified_at', startOfMonth)
        .lt('qualified_at', startOfNextMonth)

      // Apply owner filter if applicable
      if (filters?.owner === 'me' && profile?.id) {
        createdQuery = createdQuery.eq('owner_user_id', profile.id)
        qualifiedQuery = qualifiedQuery.eq('owner_user_id', profile.id)
      } else if (filters?.ownerIds && filters.ownerIds.length > 0) {
        createdQuery = createdQuery.in('owner_user_id', filters.ownerIds)
        qualifiedQuery = qualifiedQuery.in('owner_user_id', filters.ownerIds)
      }

      // Apply status filter
      if (filters?.status && filters.status.length > 0) {
        createdQuery = createdQuery.in('lead_status_id', filters.status)
        // For qualified count, we don't filter by status since qualified leads
        // have a specific status; we count based on qualified_at timestamp
      }

      // Apply origin filter
      if (filters?.origin && filters.origin.length > 0) {
        createdQuery = createdQuery.in('lead_origin_id', filters.origin)
        qualifiedQuery = qualifiedQuery.in('lead_origin_id', filters.origin)
      }

      // Execute both queries in parallel
      const [createdResult, qualifiedResult] = await Promise.all([
        createdQuery,
        qualifiedQuery
      ])

      if (createdResult.error) {
        console.error('[LeadMonthlyMetrics] Error fetching created count:', createdResult.error)
        throw createdResult.error
      }

      if (qualifiedResult.error) {
        console.error('[LeadMonthlyMetrics] Error fetching qualified count:', qualifiedResult.error)
        throw qualifiedResult.error
      }

      return {
        createdThisMonth: createdResult.count ?? 0,
        qualifiedThisMonth: qualifiedResult.count ?? 0
      }
    },
    enabled,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  })
}
