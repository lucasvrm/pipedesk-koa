import { User } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
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

interface LeadsSalesFiltersBarProps {
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

export function LeadsSalesFiltersBar({
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
}: LeadsSalesFiltersBarProps) {
  // Defensive: Ensure orderBy is always a valid value to prevent controlled/uncontrolled warnings
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
      : 'Seleção manual'
  }, [ownerMode, selectedOwners])

  const orderByLabel = useMemo(
    () => ORDER_BY_OPTIONS.find(option => option.value === safeOrderBy)?.label ?? 'Prioridade (padrão)',
    [safeOrderBy]
  )

  // Defensive: ensure arrays are valid to prevent React Error #185
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

  const handleUserSelect = useCallback((userId: string) => {
    onOwnerModeChange('custom')
    toggleItem(selectedOwners, userId, onSelectedOwnersChange)
  }, [onOwnerModeChange, onSelectedOwnersChange, selectedOwners, toggleItem])

  const handlePriorityToggle = useCallback((bucket: LeadPriorityBucket) => {
    toggleItem(priority, bucket, (values) => onPriorityChange(values as LeadPriorityBucket[]))
  }, [onPriorityChange, priority, toggleItem])

  const handleStatusToggle = useCallback((code: string) => {
    toggleItem(statuses, code, onStatusesChange)
  }, [onStatusesChange, statuses, toggleItem])

  const handleOriginToggle = useCallback((code: string) => {
    toggleItem(origins, code, onOriginsChange)
  }, [onOriginsChange, origins, toggleItem])

  return (
    <div className="rounded-xl border bg-card px-5 py-4 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Funnel size={18} />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground leading-none">Filtros Inteligentes</p>
            <p className="text-xs text-muted-foreground leading-none">Refine sua visualização de vendas.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-9 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* Main Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">

        {/* Left Column: Quem & Quando (People & Time) */}
        <div className="space-y-6">

          {/* Section: Responsável */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Responsável</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={ownerMode === 'me' ? 'default' : 'outline'}
                size="sm"
                className="h-9 px-4 text-xs font-medium"
                onClick={() => onOwnerModeChange('me')}
              >
                Meus leads
              </Button>
              <Button
                variant={ownerMode === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-9 px-4 text-xs font-medium"
                onClick={() => onOwnerModeChange('all')}
              >
                Todos
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={ownerMode === 'custom' || selectedOwners.length > 0 ? 'default' : 'outline'}
                    size="sm"
                    className="h-9 gap-2 px-3 text-xs"
                  >
                    <UserSwitch size={16} />
                    {ownerLabel}
                    <CaretDown size={12} />
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
                              <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
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

          {/* Section: Engajamento */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dias sem interação</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_PRESETS.map(days => (
                <Button
                  key={days}
                  variant={daysWithoutInteraction === days ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 px-3 text-xs font-medium min-w-[3rem]"
                  onClick={() => onDaysWithoutInteractionChange(days)}
                >
                  {days}
                </Button>
              ))}
              <Button
                variant={daysWithoutInteraction === null ? 'default' : 'outline'}
                size="sm"
                className="h-9 px-3 text-xs font-medium"
                onClick={() => onDaysWithoutInteractionChange(null)}
              >
                Qualquer
              </Button>
            </div>
          </div>

        </div>

        {/* Right Column: O Que & Como (Characteristics & Sort) */}
        <div className="space-y-6">

          {/* Section: Segmentação */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Características do Lead</label>
            <div className="flex flex-wrap items-center gap-2.5">

              {/* Origem */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={origins.length > 0 ? 'secondary' : 'outline'}
                    size="sm"
                    className={`h-9 gap-2 px-3 text-xs ${origins.length > 0 ? 'border-primary/20 text-primary' : ''}`}
                  >
                    Origem {origins.length > 0 && `(${origins.length})`}
                    <CaretDown size={12} className="opacity-50" />
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

              {/* Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={statuses.length > 0 ? 'secondary' : 'outline'}
                    size="sm"
                    className={`h-9 gap-2 px-3 text-xs ${statuses.length > 0 ? 'border-primary/20 text-primary' : ''}`}
                  >
                    Status {statuses.length > 0 && `(${statuses.length})`}
                    <CaretDown size={12} className="opacity-50" />
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

              <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

              {/* Prioridade */}
              <div className="flex bg-muted p-1 rounded-md gap-0.5">
                {PRIORITY_OPTIONS.map(option => {
                  const isActive = priority.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      onClick={() => handlePriorityToggle(option.value)}
                      className={`
                        px-3 py-1 text-[11px] font-medium rounded-sm transition-all
                        ${isActive
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}
                      `}
                    >
                      {safeString(option.label, option.value)}
                    </button>
                  )
                })}
              </div>

            </div>
          </div>

          {/* Section: Ordenação */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ordenação</label>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    role="combobox"
                    className="h-9 w-full sm:w-[220px] justify-between gap-2 px-3 text-xs font-normal"
                  >
                    <span className="truncate text-left">{orderByLabel}</span>
                    <CaretDown size={12} className="opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[240px]">
                  <DropdownMenuRadioGroup value={safeOrderBy} onValueChange={handleOrderByChange}>
                    {ORDER_BY_OPTIONS.map(option => (
                      <DropdownMenuRadioItem key={option.value} value={option.value} className="flex items-center gap-2">
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
