import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LeadPriorityBucket } from '@/lib/types'

/**
 * URL parameter keys for lead filters
 */
export const FILTER_PARAM_KEYS = {
  VIEW: 'view',
  SEARCH: 'q',
  OWNER: 'owner',
  OWNER_IDS: 'ownerIds',
  PRIORITY: 'priority',
  STATUS: 'status',
  ORIGIN: 'origin',
  TAGS: 'tags',
  NEXT_ACTION: 'next_action',
  DAYS_WITHOUT_INTERACTION: 'days_without_interaction',
  ORDER_BY: 'order_by',
  PAGE: 'page',
} as const

/**
 * Type for parsed/applied filters derived from URL
 */
export interface AppliedLeadsFilters {
  view: 'grid' | 'kanban' | 'sales'
  search: string
  ownerMode: 'me' | 'all' | 'custom'
  ownerIds: string[]
  priority: LeadPriorityBucket[]
  status: string[]
  origin: string[]
  tags: string[]
  nextAction: string[]
  daysWithoutInteraction: number | null
  orderBy: 'priority' | 'last_interaction' | 'created_at' | 'status' | 'next_action' | 'owner'
  page: number
}

/**
 * Valid values for orderBy parameter
 */
const VALID_ORDER_BY = ['priority', 'last_interaction', 'created_at', 'status', 'next_action', 'owner'] as const
type OrderByValue = typeof VALID_ORDER_BY[number]

/**
 * Parses a comma-separated string into an array of non-empty strings
 */
function parseCSV(value: string | null): string[] {
  if (!value) return []
  return value.split(',').filter(Boolean)
}

/**
 * Serializes an array to a comma-separated string, or returns null if empty
 */
function serializeCSV(values: string[]): string | null {
  return values.length > 0 ? values.join(',') : null
}

/**
 * Parses URL search params into AppliedLeadsFilters object
 */
export function parseFiltersFromSearchParams(searchParams: URLSearchParams): AppliedLeadsFilters {
  // Parse view
  const viewParam = searchParams.get(FILTER_PARAM_KEYS.VIEW)
  let view: AppliedLeadsFilters['view'] = 'sales' // default
  if (viewParam === 'grid' || viewParam === 'kanban' || viewParam === 'sales') {
    view = viewParam
  } else if (viewParam === 'list') {
    // Backward compatibility: 'list' maps to 'sales'
    view = 'sales'
  }

  // Parse search
  const search = searchParams.get(FILTER_PARAM_KEYS.SEARCH) || ''

  // Parse owner mode and IDs
  const ownerParam = searchParams.get(FILTER_PARAM_KEYS.OWNER)
  const ownerIdsParam = searchParams.get(FILTER_PARAM_KEYS.OWNER_IDS)
  const ownerIds = parseCSV(ownerIdsParam)
  let ownerMode: AppliedLeadsFilters['ownerMode'] = 'all'
  if (ownerParam === 'me') {
    ownerMode = 'me'
  } else if (ownerIds.length > 0) {
    ownerMode = 'custom'
  }

  // Parse multi-value filters
  const priority = parseCSV(searchParams.get(FILTER_PARAM_KEYS.PRIORITY)) as LeadPriorityBucket[]
  const status = parseCSV(searchParams.get(FILTER_PARAM_KEYS.STATUS))
  const origin = parseCSV(searchParams.get(FILTER_PARAM_KEYS.ORIGIN))
  const tags = parseCSV(searchParams.get(FILTER_PARAM_KEYS.TAGS))
  const nextAction = parseCSV(searchParams.get(FILTER_PARAM_KEYS.NEXT_ACTION))

  // Parse days without interaction
  const daysParam = searchParams.get(FILTER_PARAM_KEYS.DAYS_WITHOUT_INTERACTION)
  const daysWithoutInteraction = daysParam ? Number(daysParam) : null

  // Parse orderBy with validation
  const orderByParam = searchParams.get(FILTER_PARAM_KEYS.ORDER_BY)
  const orderBy: OrderByValue = VALID_ORDER_BY.includes(orderByParam as OrderByValue)
    ? (orderByParam as OrderByValue)
    : 'priority'

  // Parse page
  const pageParam = searchParams.get(FILTER_PARAM_KEYS.PAGE)
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  return {
    view,
    search,
    ownerMode,
    ownerIds,
    priority,
    status,
    origin,
    tags,
    nextAction,
    daysWithoutInteraction,
    orderBy,
    page,
  }
}

/**
 * Converts AppliedLeadsFilters to URLSearchParams
 */
export function serializeFiltersToSearchParams(filters: AppliedLeadsFilters): URLSearchParams {
  const params = new URLSearchParams()

  // View - only set if not default
  if (filters.view && filters.view !== 'sales') {
    params.set(FILTER_PARAM_KEYS.VIEW, filters.view)
  }

  // Search
  if (filters.search) {
    params.set(FILTER_PARAM_KEYS.SEARCH, filters.search)
  }

  // Owner
  if (filters.ownerMode === 'me') {
    params.set(FILTER_PARAM_KEYS.OWNER, 'me')
  } else if (filters.ownerMode === 'custom' && filters.ownerIds.length > 0) {
    params.set(FILTER_PARAM_KEYS.OWNER_IDS, filters.ownerIds.join(','))
  }

  // Multi-value filters
  const priorityCSV = serializeCSV(filters.priority)
  if (priorityCSV) params.set(FILTER_PARAM_KEYS.PRIORITY, priorityCSV)

  const statusCSV = serializeCSV(filters.status)
  if (statusCSV) params.set(FILTER_PARAM_KEYS.STATUS, statusCSV)

  const originCSV = serializeCSV(filters.origin)
  if (originCSV) params.set(FILTER_PARAM_KEYS.ORIGIN, originCSV)

  const tagsCSV = serializeCSV(filters.tags)
  if (tagsCSV) params.set(FILTER_PARAM_KEYS.TAGS, tagsCSV)

  const nextActionCSV = serializeCSV(filters.nextAction)
  if (nextActionCSV) params.set(FILTER_PARAM_KEYS.NEXT_ACTION, nextActionCSV)

  // Days without interaction
  if (filters.daysWithoutInteraction !== null) {
    params.set(FILTER_PARAM_KEYS.DAYS_WITHOUT_INTERACTION, String(filters.daysWithoutInteraction))
  }

  // Order by - only set if not default
  if (filters.orderBy && filters.orderBy !== 'priority') {
    params.set(FILTER_PARAM_KEYS.ORDER_BY, filters.orderBy)
  }

  // Page - only set if not 1
  if (filters.page > 1) {
    params.set(FILTER_PARAM_KEYS.PAGE, String(filters.page))
  }

  return params
}

/**
 * Hook return type for filter actions
 */
export interface FilterActions {
  /** Set search term */
  setSearch: (value: string) => void
  /** Set view mode */
  setView: (view: AppliedLeadsFilters['view']) => void
  /** Set owner mode */
  setOwnerMode: (mode: AppliedLeadsFilters['ownerMode']) => void
  /** Set specific owner IDs (automatically sets mode to 'custom') */
  setOwnerIds: (ids: string[]) => void
  /** Toggle an item in a multi-select filter */
  toggleMulti: (
    filterKey: 'priority' | 'status' | 'origin' | 'tags' | 'nextAction',
    value: string
  ) => void
  /** Set all values for a multi-select filter */
  setMulti: (
    filterKey: 'priority' | 'status' | 'origin' | 'tags' | 'nextAction',
    values: string[]
  ) => void
  /** Clear a specific filter */
  clearFilter: (filterKey: keyof AppliedLeadsFilters) => void
  /** Clear all filters (keep view) */
  clearAll: () => void
  /** Set days without interaction */
  setDaysWithoutInteraction: (days: number | null) => void
  /** Set order by */
  setOrderBy: (orderBy: AppliedLeadsFilters['orderBy']) => void
  /** Set page number */
  setPage: (page: number) => void
}

/**
 * Hook that provides URL-first filter state management for Leads.
 * 
 * This hook:
 * - Parses applied filters from URL search params
 * - Provides actions to update filters (which update URL)
 * - Automatically resets page to 1 when filters change
 * - Is the single source of truth for filter state
 * 
 * @example
 * ```tsx
 * const { appliedFilters, actions } = useLeadsFiltersSearchParams()
 * 
 * // Read current filters
 * const { status, priority, view } = appliedFilters
 * 
 * // Update filters
 * actions.toggleMulti('status', 'some-status-id')
 * actions.setSearch('company name')
 * actions.clearAll()
 * ```
 */
export function useLeadsFiltersSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse current filters from URL
  const appliedFilters = useMemo<AppliedLeadsFilters>(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  )

  // Helper to update params with page reset
  const updateParams = useCallback(
    (updater: (current: AppliedLeadsFilters) => AppliedLeadsFilters, resetPage = true) => {
      setSearchParams((prev) => {
        const current = parseFiltersFromSearchParams(prev)
        const updated = updater(current)
        // Reset page when filters change (unless explicitly updating page)
        if (resetPage) {
          updated.page = 1
        }
        return serializeFiltersToSearchParams(updated)
      }, { replace: true })
    },
    [setSearchParams]
  )

  // Actions
  const actions = useMemo<FilterActions>(() => ({
    setSearch: (value: string) => {
      updateParams((current) => ({ ...current, search: value }))
    },

    setView: (view: AppliedLeadsFilters['view']) => {
      updateParams((current) => ({ ...current, view }), false) // Don't reset page on view change
    },

    setOwnerMode: (mode: AppliedLeadsFilters['ownerMode']) => {
      updateParams((current) => ({
        ...current,
        ownerMode: mode,
        ownerIds: mode !== 'custom' ? [] : current.ownerIds,
      }))
    },

    setOwnerIds: (ids: string[]) => {
      updateParams((current) => ({
        ...current,
        ownerMode: ids.length > 0 ? 'custom' : 'all',
        ownerIds: ids,
      }))
    },

    toggleMulti: (filterKey, value) => {
      updateParams((current) => {
        const currentValues = current[filterKey] as string[]
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value]
        return { ...current, [filterKey]: newValues }
      })
    },

    setMulti: (filterKey, values) => {
      updateParams((current) => ({ ...current, [filterKey]: values }))
    },

    clearFilter: (filterKey) => {
      updateParams((current) => {
        const cleared = { ...current }
        switch (filterKey) {
          case 'search':
            cleared.search = ''
            break
          case 'ownerMode':
          case 'ownerIds':
            cleared.ownerMode = 'all'
            cleared.ownerIds = []
            break
          case 'priority':
            cleared.priority = []
            break
          case 'status':
            cleared.status = []
            break
          case 'origin':
            cleared.origin = []
            break
          case 'tags':
            cleared.tags = []
            break
          case 'nextAction':
            cleared.nextAction = []
            break
          case 'daysWithoutInteraction':
            cleared.daysWithoutInteraction = null
            break
          case 'orderBy':
            cleared.orderBy = 'priority'
            break
          default:
            break
        }
        return cleared
      })
    },

    clearAll: () => {
      updateParams((current) => ({
        view: current.view, // Keep current view
        search: '',
        ownerMode: 'all',
        ownerIds: [],
        priority: [],
        status: [],
        origin: [],
        tags: [],
        nextAction: [],
        daysWithoutInteraction: null,
        orderBy: 'priority',
        page: 1,
      }), false)
    },

    setDaysWithoutInteraction: (days: number | null) => {
      updateParams((current) => ({ ...current, daysWithoutInteraction: days }))
    },

    setOrderBy: (orderBy: AppliedLeadsFilters['orderBy']) => {
      updateParams((current) => ({ ...current, orderBy }))
    },

    setPage: (page: number) => {
      updateParams((current) => ({ ...current, page }), false) // Don't reset page when setting page
    },
  }), [updateParams])

  // Count active filters (excluding view, search, orderBy, page which are not "filters")
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (appliedFilters.ownerMode !== 'all') count++
    if (appliedFilters.priority.length > 0) count++
    if (appliedFilters.status.length > 0) count++
    if (appliedFilters.origin.length > 0) count++
    if (appliedFilters.tags.length > 0) count++
    if (appliedFilters.nextAction.length > 0) count++
    if (appliedFilters.daysWithoutInteraction !== null) count++
    return count
  }, [appliedFilters])

  // Check if any filters are active (for "clear all" visibility)
  const hasActiveFilters = activeFiltersCount > 0 || appliedFilters.search !== ''

  return {
    appliedFilters,
    actions,
    activeFiltersCount,
    hasActiveFilters,
  }
}
