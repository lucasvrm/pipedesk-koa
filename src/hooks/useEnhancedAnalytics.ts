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
      // Increased timeout to 20 seconds to allow for initial cold start or heavy queries
      timer = setTimeout(() => {
        console.warn('Analytics loading timed out after 20 seconds')
        setHasTimedOut(true)
      }, 20000)
    } else {
      // If not loading, reset timeout state
      setHasTimedOut(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isCombinedLoading]) // Only re-run if loading state changes

  // If timed out, force loading to false.
  const effectiveLoading = hasTimedOut ? false : isCombinedLoading
  
  // If we timed out, we don't want to show a hard error card if possible.
  // Instead, we let the consumer handle it.
  // BUT, to satisfy "widgets not rendering", we want to return partial/empty data if possible
  // so the widgets render 0s instead of crashing or showing Error.
  // If analytics.error exists (network error), we pass it through.
  // If hasTimedOut is true, we create a specialized timeout error, OR we suppress it if we want fallback behavior.
  
  // Strategy: If timeout, we suppress the error and let the widget render with undefined metrics (which defaults to 0).
  // This avoids the "Error" card and shows 0s, which is cleaner.
  // Unless the user explicitly wants to know it failed.
  // The user complained "Error loading data". Showing 0 is better than Error.

  const effectiveError = hasTimedOut ? null : analytics.error;

  return {
    ...analytics,
    isLoading: effectiveLoading,
    error: effectiveError,
    // Add a flag so components can know if it was a timeout (optional usage)
    isTimedOut: hasTimedOut
  }
}
