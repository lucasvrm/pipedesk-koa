import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { User, Tag } from '@/lib/types'
import { AppliedLeadsFilters, FilterActions } from '../hooks/useLeadsFiltersSearchParams'
import { LeadsFiltersContent, DraftFilters } from './LeadsFiltersContent'
import { LeadsFiltersFooter } from './LeadsFiltersFooter'

interface OptionItem {
  id?: string
  code: string
  label: string
}

interface LeadsFiltersSidebarProps {
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
 * LeadsFiltersSidebar - Desktop sidebar for filters (Zoho-style)
 * 
 * This component provides a sidebar with:
 * - Scrollable body with native overflow-y: auto (independent scroll from list)
 * - Footer with Clear/Apply buttons inside scrollable area
 * - Draft mode: changes only apply when user clicks "Aplicar filtros"
 * 
 * The sidebar uses `min-h-0 overflow-hidden` on the outer container and
 * `flex-1 min-h-0 overflow-y-auto` on the body to enable independent scroll
 * within a flex layout. The page scroll is disabled and each panel (list + sidebar)
 * scrolls independently.
 * 
 * Visible only on md breakpoint and above.
 */
export function LeadsFiltersSidebar({
  appliedFilters,
  actions,
  users,
  leadStatuses,
  leadOrigins,
  availableTags = [],
  showNextActionFilter = false,
  isOpen = false
}: LeadsFiltersSidebarProps) {
  const wasInitializedRef = useRef(false)

  // Draft filters state - initialized from applied filters
  const [draftFilters, setDraftFilters] = useState<DraftFilters>(() => ({
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
  // Only update if these values actually changed from applied
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

  // Clear all draft filters
  const handleClearDraft = useCallback(() => {
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
    
    // Update orderBy (only for sales view, but safe to call regardless)
    actions.setOrderBy(draftFilters.orderBy)
    
    // Reset page to 1 for fresh results
    actions.setPage(1)
  }, [draftFilters, actions, showNextActionFilter])

  // Compute visibility class based on isOpen
  // When closed: hidden on all breakpoints (just 'hidden' class)
  // When open: hidden on mobile (< md), flex on md+ (hidden md:flex)
  const visibilityClass = isOpen ? 'hidden md:flex' : 'hidden'

  // Show footer when there are filters selected (draft has any filter active)
  const shouldShowFooter = draftFiltersCount > 0

  return (
    <aside
      className={`${visibilityClass} flex-col w-[320px] lg:w-[360px] shrink-0 min-h-0 border rounded-xl bg-card shadow-sm overflow-hidden`}
      data-testid="leads-filters-sidebar"
    >
      {/* Body - Scrollable with native scroll */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        data-testid="leads-filters-sidebar-scroll"
      >
        <LeadsFiltersContent
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          users={users}
          leadStatuses={leadStatuses}
          leadOrigins={leadOrigins}
          availableTags={availableTags}
          showNextActionFilter={showNextActionFilter}
        />
      </div>

      {/* Footer - Fixed at bottom, only visible when filters are selected */}
      {shouldShowFooter && (
        <div 
          className="shrink-0 border-t bg-card px-4 py-4"
          data-testid="leads-filters-footer"
        >
          <LeadsFiltersFooter
            draftFiltersCount={draftFiltersCount}
            onClear={handleClearDraft}
            onApply={handleApplyFilters}
          />
        </div>
      )}
    </aside>
  )
}
