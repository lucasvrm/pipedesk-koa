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
 * 
 * @example
 * ```tsx
 * function AnalyticsDashboard() {
 *   const [dateFilter, setDateFilter] = useState<DateFilterType>('30d')
 *   const [teamFilter, setTeamFilter] = useState('all')
 *   const [typeFilter, setTypeFilter] = useState('all')
 *   
 *   const { data: metrics, isLoading } = useEnhancedAnalytics(
 *     dateFilter,
 *     teamFilter,
 *     typeFilter
 *   )
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   
 *   return (
 *     <div>
 *       <h2>Total Deals: {metrics?.totalDeals}</h2>
 *       <h2>Weighted Pipeline: ${metrics?.weightedPipeline.toLocaleString()}</h2>
 *     </div>
 *   )
 * }
 * ```
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
  // Note: Some DateFilterType values ('today', '7d', 'ytd') are mapped to 'all'
  // because the legacy analytics service only supports '30d', '90d', '1y', and 'all'
  const legacyDateFilter: 'all' | '30d' | '90d' | '1y' = 
    dateFilter === '30d' ? '30d' :
    dateFilter === '90d' ? '90d' :
    dateFilter === '1y' ? '1y' :
    'all'  // Fallback for 'today', '7d', 'ytd', and 'all'
  
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
  
  // Add timeout to prevent infinite loading state
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [wasLoading, setWasLoading] = useState(false)
  
  useEffect(() => {
    const isCurrentlyLoading = analytics.isLoading || metadataLoading || teamLoading
    
    // Clear any existing timeout first
    let timeout: NodeJS.Timeout | undefined
    
    // Reset timeout when loading state changes from false to true
    if (isCurrentlyLoading && !wasLoading) {
      setHasTimedOut(false)
      
      // Set a timeout to prevent infinite loading
      timeout = setTimeout(() => {
        console.warn('Analytics loading timed out after 10 seconds')
        setHasTimedOut(true)
      }, 10000) // 10 second timeout
    }
    
    setWasLoading(isCurrentlyLoading)
    
    // Always cleanup timeout on unmount or when effect re-runs
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [analytics.isLoading, metadataLoading, teamLoading, wasLoading])
  
  // If timed out, force loading to false and show data if available
  const effectiveLoading = hasTimedOut ? false : (analytics.isLoading || metadataLoading || teamLoading)
  
  return {
    ...analytics,
    isLoading: effectiveLoading
  }
}
