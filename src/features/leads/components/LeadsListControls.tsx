import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { LayoutGrid, ChevronDown, Trash2, Filter, AlignJustify, Kanban, ChevronLeft, ChevronRight, Flame, Thermometer, Snowflake, UserCircle, CircleDot, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type InternalViewMode = 'grid' | 'kanban' | 'sales'

interface LeadsListControlsProps {
  /** Position of the controls - 'top' or 'bottom' */
  position: 'top' | 'bottom'
  /** Current view mode */
  currentView: InternalViewMode
  /** Handler for view change */
  onViewChange: (view: InternalViewMode) => void
  /** Active filters count */
  activeFiltersCount: number
  /** Handler to open filter panel */
  onOpenFilterPanel: () => void
  /** Whether the filter panel/sidebar is currently open */
  isFiltersOpen?: boolean
  /** Selected lead IDs for bulk actions */
  selectedIds: string[]
  /** Handler for bulk delete */
  onBulkDelete: () => void
  /** Total number of leads */
  totalLeads: number
  /** Current items per page */
  itemsPerPage: number
  /** Handler to change items per page */
  onItemsPerPageChange: (pageSize: number) => void
  /** Whether pagination should be shown */
  showPagination: boolean
  /** Start item number for range display */
  startItem: number
  /** End item number for range display */
  endItem: number
  /** Current page number */
  currentPage: number
  /** Total pages */
  totalPages: number
  /** Handler to change page */
  onPageChange: (page: number) => void
  /** Bulk actions */
  onBulkPriorityChange?: (priority: 'hot' | 'warm' | 'cold') => void
  onBulkStatusChange?: (statusId: string) => void
  onBulkOwnerChange?: (ownerId: string | null) => void
  availableStatuses?: { id: string; label: string }[]
  availableOwners?: { id: string; name: string }[]
}

/**
 * LeadsListControls - Reusable controls bar for the leads list
 * 
 * Renders the filter button, view toggles, create button, and pagination controls.
 * Can be positioned at top or bottom of the list.
 */
export function LeadsListControls({
  position,
  currentView,
  onViewChange,
  activeFiltersCount,
  onOpenFilterPanel,
  isFiltersOpen = false,
  selectedIds,
  onBulkDelete,
  totalLeads,
  itemsPerPage,
  onItemsPerPageChange,
  showPagination,
  startItem,
  endItem,
  currentPage,
  totalPages,
  onPageChange,
  onBulkPriorityChange,
  onBulkStatusChange,
  onBulkOwnerChange,
  availableStatuses = [],
  availableOwners = [],
}: LeadsListControlsProps) {
  const testIdSuffix = position === 'bottom' ? '-bottom' : ''
  
  // Compute border class based on position
  const line2BorderClass = position === 'top' ? 'border-b' : 'border-t'
  
  return (
    <div data-testid={position === 'bottom' ? 'leads-bottom-bar' : 'leads-top-bar'}>
      {/* Line 1: Filter button (left) + View toggles + Create Lead button (right) */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <Button
            variant={isFiltersOpen ? 'default' : activeFiltersCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            className={cn(
              "h-9 gap-2",
              isFiltersOpen 
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:hover:border-red-800"
            )}
            onClick={onOpenFilterPanel}
            aria-pressed={isFiltersOpen}
            data-testid={`filter-panel-trigger${testIdSuffix}`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge 
                variant={isFiltersOpen ? 'outline' : 'secondary'} 
                className="ml-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {/* Bulk actions dropdown */}
          {selectedIds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Ações ({selectedIds.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {/* Prioridade */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Flame className="mr-2 h-4 w-4" />
                    Alterar Prioridade
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => onBulkPriorityChange?.('hot')}>
                      <Flame className="mr-2 h-4 w-4 text-red-500" />
                      Alta (Hot)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkPriorityChange?.('warm')}>
                      <Thermometer className="mr-2 h-4 w-4 text-amber-500" />
                      Média (Warm)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkPriorityChange?.('cold')}>
                      <Snowflake className="mr-2 h-4 w-4 text-blue-500" />
                      Baixa (Cold)
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Status */}
                {availableStatuses && availableStatuses.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <CircleDot className="mr-2 h-4 w-4" />
                      Alterar Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {availableStatuses.map(status => (
                        <DropdownMenuItem 
                          key={status.id} 
                          onClick={() => onBulkStatusChange?.(status.id)}
                        >
                          {status.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {/* Responsável */}
                {availableOwners && availableOwners.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <UserCircle className="mr-2 h-4 w-4" />
                      Alterar Responsável
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                      <DropdownMenuItem onClick={() => onBulkOwnerChange?.(null)}>
                        <span className="text-muted-foreground">Remover responsável</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {availableOwners.map(owner => (
                        <DropdownMenuItem 
                          key={owner.id} 
                          onClick={() => onBulkOwnerChange?.(owner.id)}
                        >
                          {owner.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                <DropdownMenuSeparator />

                {/* Excluir */}
                <DropdownMenuItem 
                  onClick={onBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir selecionados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* View toggles */}
          <div className="flex items-center p-1 bg-muted rounded-md border">
            <Button
              variant={currentView === 'sales' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewChange('sales')}
              title="Lista"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
            <Button
              variant={currentView === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewChange('grid')}
              title="Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewChange('kanban')}
              title="Kanban"
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Line 2: Total count (left) + Items per page + Range + Pagination icons (right) */}
      <div className={`flex items-center justify-between px-4 py-2 bg-muted/30 ${line2BorderClass}`}>
        <div className="text-sm text-muted-foreground">
          Total de registros: <span className="font-medium text-foreground">{totalLeads}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Items per page dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Registros por página:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-[70px] justify-between">
                  <span>{itemsPerPage}</span>
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[100px]">
                <DropdownMenuRadioGroup
                  value={String(itemsPerPage)}
                  onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                  <DropdownMenuRadioItem value="10">10</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="20">20</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="50">50</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Range display */}
          {showPagination && (
            <span className="text-sm text-muted-foreground">
              {startItem}–{endItem}
            </span>
          )}

          {/* Pagination icons */}
          {showPagination && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
