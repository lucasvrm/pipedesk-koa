import { DateFilterType } from '@/types/metadata'

/**
 * Date range utility for dynamic date calculations
 * Replaces hardcoded date logic in analytics and other services
 */

export interface DateRange {
  startDate: Date
  endDate: Date
}

/**
 * Calculate a date range based on a filter type
 * @param filter - The date filter type (today, 7d, 30d, 90d, 1y, ytd, all)
 * @returns Object with startDate and endDate
 */
export function getDateRange(filter: DateFilterType): DateRange {
  const endDate = new Date()
  let startDate: Date

  switch (filter) {
    case 'today': {
      // Start of today
      startDate = new Date(endDate)
      startDate.setHours(0, 0, 0, 0)
      break
    }

    case '7d': {
      // 7 days ago
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    }

    case '30d': {
      // 30 days ago
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    }

    case '90d': {
      // 90 days ago
      startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    }

    case '1y': {
      // 365 days ago (1 year)
      startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    }

    case 'ytd': {
      // Year to date - start of current year
      startDate = new Date(endDate.getFullYear(), 0, 1)
      break
    }

    case 'all':
    default: {
      // Beginning of time - use a date far in the past
      // This is typically used to fetch all records
      startDate = new Date(2000, 0, 1)
      break
    }
  }

  return {
    startDate,
    endDate
  }
}

/**
 * Get ISO string date range for database queries
 * @param filter - The date filter type
 * @returns Object with startDate and endDate as ISO strings
 */
export function getDateRangeISO(filter: DateFilterType): { startDate: string; endDate: string } {
  const { startDate, endDate } = getDateRange(filter)
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  }
}

/**
 * Check if a filter requires date filtering
 * @param filter - The date filter type
 * @returns true if the filter should be applied to queries
 */
export function shouldApplyDateFilter(filter: DateFilterType): boolean {
  return filter !== 'all'
}
