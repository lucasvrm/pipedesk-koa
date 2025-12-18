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

/**
 * Offset for sidebar scroll area calculation.
 * This accounts for:
 * - Top navigation bar (~64px)
 * - Page padding (~24px)
 * Total: ~88px, rounded to 100px for some visual breathing room
 * Note: Header was removed and footer is now inside scroll area
 */
const SIDEBAR_SCROLL_OFFSET = '100px'

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
 * This component provides a fixed sidebar with:
 * - Header with title
 * - Scrollable body with native overflow-y: auto
 * - Fixed footer with Clear/Apply buttons
 * - Draft mode: changes only apply when user clicks "Aplicar filtros"
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

  return (
    <aside
      className={`${visibilityClass} flex-col w-[320px] lg:w-[360px] shrink-0 border rounded-xl bg-card shadow-sm overflow-hidden md:sticky md:top-20`}
      data-testid="leads-filters-sidebar"
    >
      {/* Body - Scrollable with native scroll (includes footer) */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        style={{ maxHeight: `calc(100vh - ${SIDEBAR_SCROLL_OFFSET})` }}
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

        {/* Footer - Inside scroll area, at the end of content */}
        <div className="border-t mt-4 pt-4">
          <LeadsFiltersFooter
            draftFiltersCount={draftFiltersCount}
            onClear={handleClearDraft}
            onApply={handleApplyFilters}
          />
        </div>
      </div>
    </aside>
  )
}
