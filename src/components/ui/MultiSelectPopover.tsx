import { ComponentProps, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  id: string
  label: string
  /** Optional color for visual indicator (e.g., tags) */
  color?: string
}

interface MultiSelectPopoverProps {
  /** Array of available options */
  options: MultiSelectOption[]
  /** Currently selected option IDs */
  selected: string[]
  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void
  /** Placeholder text when nothing is selected */
  placeholder?: string
  /** Search input placeholder */
  searchPlaceholder?: string
  /** Text shown when no options match search */
  emptyText?: string
  /** Optional label shown as action to clear selection */
  clearLabel?: string
  /** Optional label for "Select all" action */
  selectAllLabel?: string
  /** Show "Select all" action */
  showSelectAll?: boolean
  /** Trigger button variant */
  variant?: ComponentProps<typeof Button>['variant']
  /** Additional className for the trigger button */
  triggerClassName?: string
  /** Icon to show before the trigger label */
  icon?: React.ReactNode
  /** Align popover content */
  align?: 'start' | 'center' | 'end'
  /** Maximum height for the options list */
  maxHeight?: string
}

/**
 * MultiSelectPopover - A reusable component for multi-option filter selection.
 * 
 * Displays a trigger button with a summary of selections, and opens a Popover
 * with a searchable checkbox list.
 */
export function MultiSelectPopover({
  options,
  selected,
  onSelectionChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Nenhum item encontrado',
  clearLabel = 'Limpar',
  selectAllLabel = 'Selecionar tudo',
  showSelectAll = false,
  variant = 'outline',
  triggerClassName,
  icon,
  align = 'start',
  maxHeight = '200px'
}: MultiSelectPopoverProps) {
  // Generate trigger label based on selection
  const triggerLabel = useMemo(() => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) {
      const selectedOption = options.find(o => o.id === selected[0])
      return selectedOption?.label || '1 selecionado'
    }
    return `${selected.length} selecionados`
  }, [selected, options, placeholder])

  // Toggle a single option
  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onSelectionChange(selected.filter(s => s !== id))
    } else {
      onSelectionChange([...selected, id])
    }
  }

  // Clear all selections
  const handleClear = () => {
    onSelectionChange([])
  }

  // Select all options
  const handleSelectAll = () => {
    onSelectionChange(options.map(o => o.id))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex">
          <Button
            variant={selected.length > 0 ? 'secondary' : variant}
            size="sm"
            className={cn('h-9 gap-2 px-3 justify-between', triggerClassName)}
            type="button"
          >
            <span className="flex items-center gap-2">
              {icon}
              <span className="truncate max-w-[180px]">{triggerLabel}</span>
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 z-[60]" 
        align={align}
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          {(showSelectAll || selected.length > 0) && (
            <div className="flex items-center justify-between px-2 py-1.5 border-b">
              {showSelectAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleSelectAll}
                  type="button"
                >
                  {selectAllLabel}
                </Button>
              )}
              {selected.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground ml-auto"
                  onClick={handleClear}
                  type="button"
                >
                  {clearLabel}
                </Button>
              )}
            </div>
          )}
          <CommandList style={{ maxHeight }}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map(option => {
                const isSelected = selected.includes(option.id)
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleToggle(option.id)}
                    className="cursor-pointer"
                  >
                    <div className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {option.color && (
                      <div 
                        className="h-2.5 w-2.5 rounded-full mr-2 shrink-0" 
                        style={{ backgroundColor: option.color }} 
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
