/**
 * Status to Semantic Mapping
 * Maps entity-specific statuses to semantic colors for StatusBadge component
 */

import type { SemanticStatus } from '@/components/ui/StatusBadge'
import type { LeadStatus, DealStatus } from './types'

/**
 * Maps Lead status to semantic status colors
 */
export function leadStatusMap(status: LeadStatus | string | undefined): SemanticStatus {
  switch (status) {
    case 'new':
      return 'info' // New leads are informational (blue)
    case 'contacted':
      return 'warning' // Contacted but not qualified yet (amber/yellow)
    case 'qualified':
      return 'success' // Successfully qualified (green)
    case 'disqualified':
      return 'error' // Disqualified/rejected (red)
    default:
      return 'neutral' // Fallback
  }
}

/**
 * Maps Deal/Track status to semantic status colors
 * Both Deal and Track use the same status types: active, cancelled, concluded, on_hold
 */
export function dealStatusMap(status: DealStatus | string | undefined): SemanticStatus {
  switch (status) {
    case 'active':
      return 'success' // Active deals or tracks (green)
    case 'concluded':
      return 'info' // Concluded successfully (blue)
    case 'cancelled':
      return 'error' // Cancelled/rejected (red)
    case 'on_hold':
      return 'warning' // On hold/waiting (amber/yellow)
    default:
      return 'neutral' // Fallback
  }
}

/**
 * Alias for track status mapping (uses the same logic as deals)
 */
export const trackStatusMap = dealStatusMap
