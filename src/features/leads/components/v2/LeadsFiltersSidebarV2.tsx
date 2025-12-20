import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { User, Tag } from '@/lib/types'
import { AppliedLeadsFilters, FilterActions } from '../../hooks/useLeadsFiltersSearchParams'
import { LeadsFiltersContentV2, DraftFiltersV2 } from './LeadsFiltersContentV2'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Filter, X } from 'lucide-react'

interface OptionItem {
  id?: string
  code: string
  label: string
}

interface LeadsFiltersSidebarV2Props {
  /** Current applied filters from URL */
  appliedFilters: AppliedLeadsFilters
  /** Actions to update filters */
  actions: FilterActions
  /** Available users for owner filter */
  users: User[]
  /** Available lead statuses */
  leadStatuses: OptionItem[]
  /** Available lead origins */
  leadOrigins: OptionItem[]
  /** Available tags */
  availableTags?: Tag[]
  /** Show next action filter (only for sales view) */
  showNextActionFilter?: boolean
  /** Controls visibility of the sidebar on desktop (md+). Default: false */
  isOpen?: boolean
}

/**
 * LeadsFiltersSidebarV2 - Compact desktop sidebar for filters (280px width)
 * 
 * Features:
 * - Compact design: 280px width (vs 340px V1)
 * - Sticky header with filter count and clear button
 * - Scrollable content area with collapsible sections
 * - Sticky footer with "Apply filters" button
 * - Draft mode: changes only apply when user clicks "Apply"
 * - Priority pills with colored active states
 * 
 * This is the V2 version activated by feature flag FEATURE_FLAGS.USE_NEW_FILTERS_SIDEBAR
 */
export function LeadsFiltersSidebarV2({
  appliedFilters,
  actions,
  users,
  leadStatuses,
  leadOrigins,
  availableTags = [],
  showNextActionFilter = false,
  isOpen = false
}: LeadsFiltersSidebarV2Props) {
  const wasInitializedRef = useRef(false)

  // Draft filters state - initialized from applied filters
  const [draftFilters, setDraftFilters] = useState<DraftFiltersV2>(() => ({
    ownerMode: appliedFilters.ownerMode,
    selectedOwners: appliedFilters.ownerIds,
    priority: appliedFilters.priority,
    statuses: appliedFilters.status,
    origins: appliedFilters.origin,
    daysWithoutInteraction: appliedFilters.daysWithoutInteraction,
    selectedTags: appliedFilters.tags,
    nextActions: appliedFilters.nextAction,
    orderBy: appliedFilters.orderBy
  }))

  // Sync draft with applied when URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    // Skip first render
    if (!wasInitializedRef.current) {
      wasInitializedRef.current = true
      return
    }

    // Update draft to match applied filters from URL
    setDraftFilters({
      ownerMode: appliedFilters.ownerMode,
      selectedOwners: appliedFilters.ownerIds,
      priority: appliedFilters.priority,
      statuses: appliedFilters.status,
      origins: appliedFilters.origin,
      daysWithoutInteraction: appliedFilters.daysWithoutInteraction,
      selectedTags: appliedFilters.tags,
      nextActions: appliedFilters.nextAction,
      orderBy: appliedFilters.orderBy
    })
  }, [appliedFilters])

  // Draft filters count
  const draftFiltersCount = useMemo(() => {
    let count = 0
    if (draftFilters.ownerMode !== 'all') count++
    if (draftFilters.priority.length > 0) count++
    if (draftFilters.statuses.length > 0) count++
    if (draftFilters.origins.length > 0) count++
    if (draftFilters.daysWithoutInteraction !== null) count++
    if (draftFilters.selectedTags.length > 0) count++
    if (showNextActionFilter && draftFilters.nextActions.length > 0) count++
    return count
  }, [draftFilters, showNextActionFilter])

  // Helper for efficient array comparison (defined outside useMemo to avoid recreation)
  const arraysEqual = useCallback((a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    const setA = new Set(a)
    return b.every(item => setA.has(item))
  }, [])

  // Check if there are changes (draft differs from applied)
  const hasChanges = useMemo(() => {
    if (draftFilters.ownerMode !== appliedFilters.ownerMode) return true
    if (!arraysEqual(draftFilters.selectedOwners, appliedFilters.ownerIds)) return true
    if (!arraysEqual(draftFilters.priority, appliedFilters.priority)) return true
    if (!arraysEqual(draftFilters.statuses, appliedFilters.status)) return true
    if (!arraysEqual(draftFilters.origins, appliedFilters.origin)) return true
    if (draftFilters.daysWithoutInteraction !== appliedFilters.daysWithoutInteraction) return true
    if (!arraysEqual(draftFilters.selectedTags, appliedFilters.tags)) return true
    if (!arraysEqual(draftFilters.nextActions, appliedFilters.nextAction)) return true
    if (draftFilters.orderBy !== appliedFilters.orderBy) return true
    return false
  }, [draftFilters, appliedFilters, arraysEqual])

  // Clear all draft filters
  const handleClearAll = useCallback(() => {
    setDraftFilters({
      ownerMode: 'all',
      selectedOwners: [],
      priority: [],
      statuses: [],
      origins: [],
      daysWithoutInteraction: null,
      selectedTags: [],
      nextActions: [],
      orderBy: 'priority'
    })
  }, [])

  // Apply filters - commit draft to applied state via URL
  const handleApplyFilters = useCallback(() => {
    // Update owner
    actions.setOwnerMode(draftFilters.ownerMode)
    if (draftFilters.ownerMode === 'custom') {
      actions.setOwnerIds(draftFilters.selectedOwners)
    }
    
    // Update multi-select filters
    actions.setMulti('priority', draftFilters.priority)
    actions.setMulti('status', draftFilters.statuses)
    actions.setMulti('origin', draftFilters.origins)
    actions.setMulti('tags', draftFilters.selectedTags)
    if (showNextActionFilter) {
      actions.setMulti('nextAction', draftFilters.nextActions)
    }
    
    // Update days without interaction
    actions.setDaysWithoutInteraction(draftFilters.daysWithoutInteraction)
    
    // Update orderBy
    actions.setOrderBy(draftFilters.orderBy)
    
    // Reset page to 1 for fresh results
    actions.setPage(1)
  }, [draftFilters, actions, showNextActionFilter])

  // Compute visibility class based on isOpen
  const visibilityClass = isOpen ? 'hidden md:flex' : 'hidden'

  // Button should be disabled when there are no changes to apply AND no filters are selected
  // This allows users to click "Apply" even when just resetting filters (hasChanges from clearing)
  const isApplyDisabled = !hasChanges && draftFiltersCount === 0

  return (
    <aside
      className={`${visibilityClass} flex-col w-[280px] shrink-0 h-full max-h-full border rounded-xl bg-card shadow-sm overflow-hidden`}
      data-testid="leads-filters-sidebar-v2"
    >
      {/* Header sticky */}
      <div className="sticky top-0 bg-card border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-semibold text-sm">Filtros</span>
            {draftFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {draftFiltersCount}
              </Badge>
            )}
          </div>
          {draftFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 px-2 text-xs"
              data-testid="v2-clear-all-btn"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 min-h-0">
        <LeadsFiltersContentV2
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          users={users}
          leadStatuses={leadStatuses}
          leadOrigins={leadOrigins}
          availableTags={availableTags}
          showNextActionFilter={showNextActionFilter}
        />
      </ScrollArea>

      {/* Footer sticky */}
      <div className="sticky bottom-0 bg-card border-t p-4">
        <Button
          className="w-full"
          onClick={handleApplyFilters}
          disabled={isApplyDisabled}
          data-testid="v2-apply-filters-btn"
        >
          Aplicar filtros
          {draftFiltersCount > 0 && ` (${draftFiltersCount})`}
        </Button>
      </div>
    </aside>
  )
}
