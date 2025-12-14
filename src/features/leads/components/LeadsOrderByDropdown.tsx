import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import { LeadOrderBy, ORDER_BY_OPTIONS } from './LeadsSmartFilters'

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
        <DropdownMenuRadioGroup value={safeOrderBy} onValueChange={handleOrderByChange}>
          {ORDER_BY_OPTIONS.map(option => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
