import { useSystemMetadata } from './useSystemMetadata'
import { useOperationalTeam } from './useOperationalTeam'
import { getDateRange } from '@/utils/dateRangeUtils'
import { DateFilterType } from '@/types/metadata'
import { useAnalyticsWithMetadata } from '@/services/analyticsService'

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
  
  return {
    ...analytics,
    isLoading: analytics.isLoading || metadataLoading || teamLoading
  }
}
