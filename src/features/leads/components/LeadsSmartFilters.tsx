import { User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Funnel, UserSwitch, Check, CaretDown, X } from '@phosphor-icons/react'
import { useMemo, useCallback } from 'react'
import { LeadPriorityBucket } from '@/lib/types'
import { safeString, ensureArray } from '@/lib/utils'

interface OptionItem {
  id?: string
  code: string
  label: string
}

interface LeadsSmartFiltersProps {
  ownerMode: 'me' | 'all' | 'custom'
  onOwnerModeChange: (mode: 'me' | 'all' | 'custom') => void
  selectedOwners: string[]
  onSelectedOwnersChange: (ids: string[]) => void
  priority: LeadPriorityBucket[]
  onPriorityChange: (values: LeadPriorityBucket[]) => void
  statuses: string[]
  onStatusesChange: (ids: string[]) => void
  origins: string[]
  onOriginsChange: (ids: string[]) => void
  daysWithoutInteraction: number | null
  onDaysWithoutInteractionChange: (value: number | null) => void
  orderBy: 'priority' | 'last_interaction' | 'created_at'
  onOrderByChange: (value: 'priority' | 'last_interaction' | 'created_at') => void
  users: User[]
  leadStatuses: OptionItem[]
  leadOrigins: OptionItem[]
  onClear: () => void
}

const PRIORITY_OPTIONS: { value: LeadPriorityBucket; label: string; description: string }[] = [
  { value: 'hot', label: 'Hot', description: 'Score alto, lead muito quente' },
  { value: 'warm', label: 'Warm', description: 'Score moderado, lead engajado' },
  { value: 'cold', label: 'Cold', description: 'Score baixo, lead frio' }
]

const ORDER_BY_OPTIONS: { value: 'priority' | 'last_interaction' | 'created_at'; label: string }[] = [
  { value: 'priority', label: 'Prioridade (padrão)' },
  { value: 'last_interaction', label: 'Última interação' },
  { value: 'created_at', label: 'Data de criação' }
]

const DAYS_PRESETS = [3, 7, 14]

/**
 * LeadsSmartFilters - Compact Filter Component for DataToolbar
 * 
 * Adapted from LeadsSalesFiltersBar with a more compact, popover-based design
 * suitable for embedding in a horizontal toolbar.
 */
export function LeadsSmartFilters({
  ownerMode,
  onOwnerModeChange,
  selectedOwners,
  onSelectedOwnersChange,
  priority,
  onPriorityChange,
  statuses,
  onStatusesChange,
  origins,
  onOriginsChange,
  daysWithoutInteraction,
  onDaysWithoutInteractionChange,
  orderBy,
  onOrderByChange,
  users,
  leadStatuses,
  leadOrigins,
  onClear
}: LeadsSmartFiltersProps) {
  // Defensive: Ensure orderBy is always a valid value
  const safeOrderBy: 'priority' | 'last_interaction' | 'created_at' =
    orderBy === 'priority' || orderBy === 'last_interaction' || orderBy === 'created_at'
      ? orderBy
      : 'priority'

  const handleOrderByChange = useCallback(
    (value: string) => {
      if (value === 'priority' || value === 'last_interaction' || value === 'created_at') {
        onOrderByChange(value)
      }
    },
    [onOrderByChange]
  )

  const ownerLabel = useMemo(() => {
    if (ownerMode === 'me') return 'Meus leads'
    if (ownerMode === 'all') return 'Todos'
    return selectedOwners.length > 0
      ? `${selectedOwners.length} selecionado${selectedOwners.length > 1 ? 's' : ''}`
      : 'Responsável'
  }, [ownerMode, selectedOwners])

  const orderByLabel = useMemo(
    () => ORDER_BY_OPTIONS.find(option => option.value === safeOrderBy)?.label ?? 'Prioridade',
    [safeOrderBy]
  )

  // Defensive: ensure arrays are valid
  const safeUsers = ensureArray<User>(users)
  const safeLeadStatuses = ensureArray<OptionItem>(leadStatuses)
  const safeLeadOrigins = ensureArray<OptionItem>(leadOrigins)

  const toggleItem = useCallback((list: string[], value: string, onChange: (values: string[]) => void) => {
    if (list.includes(value)) {
      onChange(list.filter(item => item !== value))
    } else {
      onChange([...list, value])
    }
  }, [])

  const handleUserSelect = useCallback(
    (userId: string) => {
      onOwnerModeChange('custom')
      toggleItem(selectedOwners, userId, onSelectedOwnersChange)
    },
    [onOwnerModeChange, onSelectedOwnersChange, selectedOwners, toggleItem]
  )

  const handlePriorityToggle = useCallback(
    (bucket: LeadPriorityBucket) => {
      toggleItem(priority, bucket, values => onPriorityChange(values as LeadPriorityBucket[]))
    },
    [onPriorityChange, priority, toggleItem]
  )

  const handleStatusToggle = useCallback(
    (code: string) => {
      toggleItem(statuses, code, onStatusesChange)
    },
    [onStatusesChange, statuses, toggleItem]
  )

  const handleOriginToggle = useCallback(
    (code: string) => {
      toggleItem(origins, code, onOriginsChange)
    },
    [onOriginsChange, origins, toggleItem]
  )

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (ownerMode !== 'me') count++
    if (priority.length > 0) count++
    if (statuses.length > 0) count++
    if (origins.length > 0) count++
    if (daysWithoutInteraction !== null) count++
    if (orderBy !== 'priority') count++
    return count
  }, [ownerMode, priority, statuses, origins, daysWithoutInteraction, orderBy])

  return (
    <>
      {/* Main Filters Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={activeFiltersCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="h-9 gap-2 px-3"
          >
            <Funnel size={16} />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <CaretDown size={12} className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[480px] p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Funnel size={18} className="text-primary" />
                <span className="text-sm font-semibold">Filtros Inteligentes</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClear} className="h-8 gap-1.5 px-2 text-xs">
                <X size={14} />
                Limpar
              </Button>
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Responsável
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={ownerMode === 'me' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => onOwnerModeChange('me')}
                >
                  Meus leads
                </Button>
                <Button
                  variant={ownerMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => onOwnerModeChange('all')}
                >
                  Todos
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={ownerMode === 'custom' || selectedOwners.length > 0 ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 gap-2 px-3 text-xs"
                    >
                      <UserSwitch size={14} />
                      {ownerLabel}
                      <CaretDown size={10} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0">
                    <Command>
                      <CommandInput placeholder="Buscar usuário" className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum usuário encontrado</CommandEmpty>
                        <CommandGroup>
                          {safeUsers.map(user => {
                            const isSelected = selectedOwners.includes(user.id)
                            return (
                              <CommandItem key={user.id} onSelect={() => handleUserSelect(user.id)}>
                                <div
                                  className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'
                                  }`}
                                >
                                  {isSelected && <Check size={12} weight="bold" />}
                                </div>
                                <span>{safeString(user.name, 'Usuário')}</span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Prioridade
              </label>
              <div className="flex bg-muted p-1 rounded-md gap-0.5">
                {PRIORITY_OPTIONS.map(option => {
                  const isActive = priority.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      onClick={() => handlePriorityToggle(option.value)}
                      className={`
                        flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-all
                        ${
                          isActive
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                        }
                      `}
                    >
                      {safeString(option.label, option.value)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status e Origem */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Características
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Status */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={statuses.length > 0 ? 'secondary' : 'outline'}
                      size="sm"
                      className={`h-8 gap-2 px-3 text-xs ${
                        statuses.length > 0 ? 'border-primary/20' : ''
                      }`}
                    >
                      Status {statuses.length > 0 && `(${statuses.length})`}
                      <CaretDown size={10} className="opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {safeLeadStatuses.map(status => (
                      <DropdownMenuCheckboxItem
                        key={status.id}
                        checked={status.id ? statuses.includes(status.id) : false}
                        onCheckedChange={() => status.id && handleStatusToggle(status.id)}
                      >
                        {safeString(status.label, status.code)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Origem */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={origins.length > 0 ? 'secondary' : 'outline'}
                      size="sm"
                      className={`h-8 gap-2 px-3 text-xs ${origins.length > 0 ? 'border-primary/20' : ''}`}
                    >
                      Origem {origins.length > 0 && `(${origins.length})`}
                      <CaretDown size={10} className="opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {safeLeadOrigins.map(origin => (
                      <DropdownMenuCheckboxItem
                        key={origin.id}
                        checked={origin.id ? origins.includes(origin.id) : false}
                        onCheckedChange={() => origin.id && handleOriginToggle(origin.id)}
                      >
                        {safeString(origin.label, origin.code)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Dias sem interação */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Dias sem interação
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_PRESETS.map(days => (
                  <Button
                    key={days}
                    variant={daysWithoutInteraction === days ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-3 text-xs min-w-[3rem]"
                    onClick={() => onDaysWithoutInteractionChange(days)}
                  >
                    {days}
                  </Button>
                ))}
                <Button
                  variant={daysWithoutInteraction === null ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => onDaysWithoutInteractionChange(null)}
                >
                  Qualquer
                </Button>
              </div>
            </div>

            {/* Ordenação */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ordenação
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    role="combobox"
                    className="h-8 w-full justify-between gap-2 px-3 text-xs font-normal"
                  >
                    <span className="truncate text-left">{orderByLabel}</span>
                    <CaretDown size={10} className="opacity-50" />
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
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Badges */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {ownerMode === 'custom' && selectedOwners.length > 0 && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              {ownerLabel}
            </Badge>
          )}
          {priority.length > 0 && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              {priority.length} prioridade{priority.length > 1 ? 's' : ''}
            </Badge>
          )}
          {statuses.length > 0 && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              {statuses.length} status
            </Badge>
          )}
          {origins.length > 0 && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              {origins.length} origem{origins.length > 1 ? 'ns' : ''}
            </Badge>
          )}
          {daysWithoutInteraction !== null && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              {daysWithoutInteraction} dias
            </Badge>
          )}
        </div>
      )}
    </>
  )
}
