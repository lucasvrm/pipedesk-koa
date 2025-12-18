import { Button } from '@/components/ui/button'

interface LeadsFiltersFooterProps {
  /** Number of active filters for the badge */
  draftFiltersCount: number
  /** Handler for clearing all draft filters */
  onClear: () => void
  /** Handler for applying filters */
  onApply: () => void
}

/**
 * LeadsFiltersFooter - Shared footer with Clear and Apply buttons
 * 
 * Used by both LeadsFiltersSidebar (desktop) and LeadsFiltersSheet (mobile).
 */
export function LeadsFiltersFooter({
  draftFiltersCount,
  onClear,
  onApply,
}: LeadsFiltersFooterProps) {
  return (
    <div className="flex w-full gap-3">
      <Button 
        variant="outline" 
        className="flex-1" 
        onClick={onClear}
        data-testid="filter-panel-clear"
      >
        Limpar
      </Button>
      <Button 
        className="flex-1" 
        onClick={onApply}
        data-testid="filter-panel-apply"
      >
        Aplicar filtros {draftFiltersCount > 0 && `(${draftFiltersCount})`}
      </Button>
    </div>
  )
}
