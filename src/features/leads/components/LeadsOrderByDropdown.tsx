import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import { LeadOrderBy, ORDER_BY_OPTIONS } from './LeadsSmartFilters'
import { cn } from '@/lib/utils'

interface LeadsOrderByDropdownProps {
  orderBy: LeadOrderBy
  onOrderByChange: (value: LeadOrderBy) => void
}

/**
 * LeadsOrderByDropdown - Standalone ordering dropdown for the DataToolbar
 * 
 * Extracted from LeadsSmartFilters to allow ordering controls to be displayed
 * separately from the filters popover, following the visual order:
 * Busca → Filtros → Ordenação
 */
export function LeadsOrderByDropdown({
  orderBy,
  onOrderByChange
}: LeadsOrderByDropdownProps) {
  // Defensive: Ensure orderBy is always a valid value
  const safeOrderBy: LeadOrderBy =
    orderBy === 'priority' || orderBy === 'last_interaction' || orderBy === 'created_at' || 
    orderBy === 'status' || orderBy === 'next_action' || orderBy === 'owner'
      ? orderBy
      : 'priority'

  const handleOrderByChange = useCallback(
    (value: string) => {
      if (value === 'priority' || value === 'last_interaction' || value === 'created_at' ||
          value === 'status' || value === 'next_action' || value === 'owner') {
        onOrderByChange(value)
      }
    },
    [onOrderByChange]
  )

  const orderByLabel = useMemo(
    () => ORDER_BY_OPTIONS.find(option => option.value === safeOrderBy)?.label ?? 'Prioridade',
    [safeOrderBy]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          className="h-9 gap-2 px-3"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="truncate text-left">{orderByLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <div className="p-1">
          {ORDER_BY_OPTIONS.map(option => {
            const isSelected = option.value === safeOrderBy
            return (
              <button
                key={option.value}
                onClick={() => handleOrderByChange(option.value)}
                className={cn(
                  'relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'select-none'
                )}
                role="menuitemradio"
                aria-checked={isSelected}
              >
                <span className="flex-1 text-left">{option.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-destructive" />
                )}
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
