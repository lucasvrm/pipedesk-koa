import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { User, Tag } from '@/lib/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Filter } from 'lucide-react'
import { AppliedLeadsFilters, FilterActions } from '../hooks/useLeadsFiltersSearchParams'
import { LeadsFiltersContent, DraftFilters } from './LeadsFiltersContent'
import { LeadsFiltersFooter } from './LeadsFiltersFooter'

interface OptionItem {
  id?: string
  code: string
  label: string
}

interface LeadsFilterPanelProps {
  /** Whether the panel is open */
  isOpen: boolean
  /** Callback when panel open state changes */
  onOpenChange: (open: boolean) => void
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
}

/**
 * LeadsFilterPanel - Mobile Sheet/Drawer for filters with Draft Mode
 * 
 * This component provides a full-height side panel (Sheet) for filters on mobile.
 * Changes are accumulated in a draft state and only applied when the user clicks "Aplicar filtros".
 * 
 * Uses shared components:
 * - LeadsFiltersContent for filter controls
 * - LeadsFiltersFooter for action buttons
 */
export function LeadsFilterPanel({
  isOpen,
  onOpenChange,
  appliedFilters,
  actions,
  users,
  leadStatuses,
  leadOrigins,
  availableTags = [],
  showNextActionFilter = false
}: LeadsFilterPanelProps) {
  const wasOpenRef = useRef(false)
  
  // Draft filters state - initialized from applied filters when panel opens
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

  // Sync draft with applied only when panel opens (not while it's open)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Panel just opened - sync draft from applied
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
    }
    wasOpenRef.current = isOpen
  }, [isOpen, appliedFilters])

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
    
    // Close panel
    onOpenChange(false)
  }, [draftFilters, actions, showNextActionFilter, onOpenChange])

  // Show footer when there are filters selected (draft has any filter active)
  const shouldShowFooter = draftFiltersCount > 0

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md flex flex-col p-0"
        data-testid="leads-filter-panel"
      >
        {/* Header - Fixed */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                Filtrar Leads
              </SheetTitle>
              <SheetDescription className="text-sm">
                Ajuste os filtros para refinar a lista
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body - Scrollable with native scroll (overflow-y: auto) */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4 min-h-0"
          data-testid="leads-filter-panel-scroll"
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

        {/* Footer - Fixed, only visible when filters are selected */}
        {shouldShowFooter && (
          <SheetFooter 
            className="border-t px-6 py-4 flex-shrink-0"
            data-testid="leads-filters-footer"
          >
            <LeadsFiltersFooter
              draftFiltersCount={draftFiltersCount}
              onClear={handleClearDraft}
              onApply={handleApplyFilters}
            />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
