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
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Funnel size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Filtros inteligentes</p>
            <p className="text-xs text-muted-foreground leading-none mt-1">Refine a Sales View rapidamente.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Ordenar por</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-[200px] justify-between gap-2">
                <span className="truncate text-left">{orderByLabel}</span>
                <CaretDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuRadioGroup value={safeOrderBy} onValueChange={handleOrderByChange}>
                {ORDER_BY_OPTIONS.map(option => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} className="flex items-center gap-2">
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-foreground">
            <X size={14} />
            Limpar filtros
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Responsável</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={ownerMode === 'me' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onOwnerModeChange('me')}
            >
              Meus leads
            </Button>
            <Button
              variant={ownerMode === 'all' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onOwnerModeChange('all')}
            >
              Todos
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={ownerMode === 'custom' || selectedOwners.length > 0 ? 'secondary' : 'outline'}
                  size="sm"
                  className="gap-2"
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
            {selectedOwners.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {selectedOwners.slice(0, 3).map(ownerId => {
                  const user = safeUsers.find(u => u.id === ownerId)
                  return (
                    <Badge key={ownerId} variant="outline" className="text-xs">
                      {safeString(user?.name, 'Usuário')}
                    </Badge>
                  )
                })}
                {selectedOwners.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{selectedOwners.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Bucket de prioridade</div>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map(option => {
              const isActive = priority.includes(option.value)
              return (
                <Button
                  key={option.value}
                  variant={isActive ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => handlePriorityToggle(option.value)}
                >
                  {safeString(option.label, option.value)}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Status</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={statuses.length > 0 ? 'secondary' : 'outline'}
                size="sm"
                className="gap-2"
              >
                {statuses.length > 0 ? `Status (${statuses.length})` : 'Selecionar status'}
                <CaretDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
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
          <div className="flex flex-wrap gap-1">
            {statuses.map(id => {
              const status = safeLeadStatuses.find(s => s.id === id)
              return (
                <Badge key={id} variant="secondary" className="text-xs">
                  {safeString(status?.label, id)}
                </Badge>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Origem</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={origins.length > 0 ? 'secondary' : 'outline'}
                size="sm"
                className="gap-2"
              >
                {origins.length > 0 ? `Origem (${origins.length})` : 'Selecionar origens'}
                <CaretDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
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
          <div className="flex flex-wrap gap-1">
            {origins.map(id => {
              const origin = safeLeadOrigins.find(o => o.id === id)
              return (
                <Badge key={id} variant="secondary" className="text-xs">
                  {safeString(origin?.label, id)}
                </Badge>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Sem interação há</div>
          <div className="flex flex-wrap gap-2">
            {DAYS_PRESETS.map(days => (
              <Button
                key={days}
                variant={daysWithoutInteraction === days ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onDaysWithoutInteractionChange(days)}
              >
                {days} dias
              </Button>
            ))}
            <Button
              variant={daysWithoutInteraction === null ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onDaysWithoutInteractionChange(null)}
            >
              Todos
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
