import { useSystemMetadata } from './useSystemMetadata'
import { useOperationalTeam } from './useOperationalTeam'
import { getDateRange } from '@/utils/dateRangeUtils'
import { DateFilterType } from '@/types/metadata'
import { useAnalyticsWithMetadata } from '@/services/analyticsService'
import { useEffect, useState } from 'react'

/**
 * Enhanced analytics hook that integrates system metadata and operational team data
 * 
 * This hook provides a complete analytics solution by:
 * - Using SystemMetadataContext for stage probabilities
 * - Using OperationalTeam for team workload filtering
 * - Using dateRangeUtils for dynamic date calculations
 * 
 * @param dateFilter - Date filter type from metadata types
 * @param teamFilter - Team filter (user ID or 'all')
 * @param typeFilter - Operation type filter or 'all'
 * @returns Query result with analytics metrics
 */
export function useEnhancedAnalytics(
  dateFilter: DateFilterType,
  teamFilter: string = 'all',
  typeFilter: string = 'all'
) {
  // Get system metadata (stages, operation types, etc.)
  const { stages, isLoading: metadataLoading } = useSystemMetadata()
  
  // Get operational team members
  const { data: teamMembers, isLoading: teamLoading } = useOperationalTeam()
  
  // Calculate date range from filter
  const dateRange = dateFilter !== 'all' ? getDateRange(dateFilter) : undefined
  
  // Get team member IDs for workload filtering
  const teamMemberIds = teamMembers?.map(member => member.id)
  
  // Map dateFilter to old analytics format for backward compatibility
  const legacyDateFilter: 'all' | '30d' | '90d' | '1y' = 
    dateFilter === '30d' ? '30d' :
    dateFilter === '90d' ? '90d' :
    dateFilter === '1y' ? '1y' :
    'all'
  
  // Call analytics with metadata integration
  const analytics = useAnalyticsWithMetadata(
    legacyDateFilter,
    teamFilter,
    typeFilter,
    {
      stages,
      teamMembers: teamMemberIds,
      dateRange
    }
  )
  
  // Timeout state
  const [hasTimedOut, setHasTimedOut] = useState(false)
  
  // Combined loading state
  const isCombinedLoading = analytics.isLoading || metadataLoading || teamLoading

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isCombinedLoading) {
      // If loading, start timer
      timer = setTimeout(() => {
        console.warn('Analytics loading timed out after 10 seconds')
        setHasTimedOut(true)
      }, 10000) // 10 second timeout
    } else {
      // If not loading, reset timeout state
      setHasTimedOut(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isCombinedLoading]) // Only re-run if loading state changes
  
  // If timed out, force loading to false.
  // We keep the data if it exists (analytics.data might be undefined if it really timed out)
  const effectiveLoading = hasTimedOut ? false : isCombinedLoading
  
  return {
    ...analytics,
    isLoading: effectiveLoading,
    // Add a specific error if timed out and no data
    error: hasTimedOut && !analytics.data ? new Error('Request timed out') : analytics.error
  }
}
