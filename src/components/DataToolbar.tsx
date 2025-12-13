import { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AlignJustify, LayoutGrid, Kanban, Search, type LucideIcon } from 'lucide-react'

export type DataToolbarView = 'list' | 'cards' | 'kanban'

interface DataToolbarProps {
  searchTerm?: string
  onSearchChange?: (value: string) => void
  currentView?: DataToolbarView
  onViewChange?: (view: DataToolbarView) => void
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

const VIEW_LABELS: Record<DataToolbarView, string> = {
  list: 'Lista',
  cards: 'Cards',
  kanban: 'Kanban'
}

const VIEW_ENTRIES: Array<[DataToolbarView, LucideIcon]> = [
  ['list', AlignJustify],
  ['cards', LayoutGrid],
  ['kanban', Kanban]
]

/**
 * DataToolbar - Command Center Component
 * 
 * A horizontal toolbar with glassmorphism styling for search, filters, and view switching.
 * Designed for high information density and vertical rhythm.
 */
export function DataToolbar({
  searchTerm = '',
  onSearchChange,
  currentView = 'list',
  onViewChange,
  children,
  actions,
  className = ''
}: DataToolbarProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value)
  }

  return (
    <div
      className={`
        flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 
        px-4 py-3 rounded-lg border
        bg-background/80 backdrop-blur-sm
        shadow-sm
        ${className}
      `}
    >
      {/* Left side: Search + Filters */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 h-9 bg-transparent border-border/50 focus-visible:bg-background/50"
            />
          </div>
        )}

        {/* Filters Slot */}
        {children && (
          <>
            {onSearchChange && <Separator orientation="vertical" className="h-6" />}
            <div className="flex items-center gap-2 flex-wrap">{children}</div>
          </>
        )}
      </div>

      {/* Right side: View Toggle + Actions */}
      <div className="flex items-center gap-3">
        {/* Actions Slot */}
        {actions && (
          <>
            <div className="flex items-center gap-2">{actions}</div>
            {onViewChange && <Separator orientation="vertical" className="h-6" />}
          </>
        )}

        {/* View Toggle */}
        {onViewChange && (
          <div className="flex items-center border bg-muted/30 rounded-md">
            {VIEW_ENTRIES.map(([view, Icon]) => (
              <Tooltip key={view}>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentView === view ? 'secondary' : 'ghost'}
                    size="icon"
                    aria-label={VIEW_LABELS[view]}
                    onClick={() => onViewChange(view)}
                    className="h-9 w-9 rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{VIEW_LABELS[view]}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
