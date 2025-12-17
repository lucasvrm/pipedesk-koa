import { User, Tag } from '@/lib/types'
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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Filter, Users, Check, ChevronDown, X, Tag as TagIcon } from 'lucide-react'
import { useMemo, useCallback, useState } from 'react'
import { LeadPriorityBucket } from '@/lib/types'
import { safeString, ensureArray } from '@/lib/utils'

interface OptionItem {
  id?: string
  code: string
  label: string
}

// Extended type for orderBy to include new sorting options
export type LeadOrderBy = 'priority' | 'last_interaction' | 'created_at' | 'status' | 'next_action' | 'owner'

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
  users: User[]
  leadStatuses: OptionItem[]
  leadOrigins: OptionItem[]
  onClear: () => void
  // Tags support
  availableTags?: Tag[]
  selectedTags?: string[]
  onTagsChange?: (ids: string[]) => void
  showNextActionFilter?: boolean
  nextActions?: string[]
  onNextActionsChange?: (codes: string[]) => void
}

const PRIORITY_OPTIONS: { value: LeadPriorityBucket; label: string; description: string }[] = [
  { value: 'hot', label: 'Hot', description: 'Score alto, lead muito quente' },
  { value: 'warm', label: 'Warm', description: 'Score moderado, lead engajado' },
  { value: 'cold', label: 'Cold', description: 'Score baixo, lead frio' }
]

export const ORDER_BY_OPTIONS: { value: LeadOrderBy; label: string }[] = [
  { value: 'priority', label: 'Prioridade (padrão)' },
  { value: 'last_interaction', label: 'Última interação' },
  { value: 'created_at', label: 'Data de criação' },
  { value: 'status', label: 'Status' },
  { value: 'next_action', label: 'Próxima ação' },
  { value: 'owner', label: 'Responsável' }
]

const NEXT_ACTION_OPTIONS: { code: string; label: string }[] = [
  { code: 'call', label: 'Ligar' },
  { code: 'email', label: 'Enviar e-mail' },
  { code: 'send_follow_up', label: 'Follow-up' },
  { code: 'qualification', label: 'Qualificação' },
  { code: 'presentation', label: 'Apresentação' },
  { code: 'proposal', label: 'Proposta' },
  { code: 'negotiation', label: 'Negociação' },
  { code: 'closing', label: 'Fechamento' },
  { code: 'onboarding', label: 'Onboarding' },
  { code: 'post_sale', label: 'Pós-venda' },
  { code: 'reactivation', label: 'Reativação' }
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
  users,
  leadStatuses,
  leadOrigins,
  onClear,
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  showNextActionFilter = false,
  nextActions = [],
  onNextActionsChange
}: LeadsSmartFiltersProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const ownerLabel = useMemo(() => {
    if (ownerMode === 'me') return 'Meus leads'
    if (ownerMode === 'all') return 'Todos'
    return selectedOwners.length > 0
      ? `${selectedOwners.length} selecionado${selectedOwners.length > 1 ? 's' : ''}`
      : 'Responsável'
  }, [ownerMode, selectedOwners])

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
    [onOwnerModeChange, onSelectedOwnersChange, selectedOwners]
  )

  const handlePriorityToggle = useCallback(
    (bucket: LeadPriorityBucket) => {
      if (priority.includes(bucket)) {
        onPriorityChange(priority.filter(item => item !== bucket))
      } else {
        onPriorityChange([...priority, bucket])
      }
    },
    [onPriorityChange, priority]
  )

  const handleStatusToggle = useCallback(
    (code: string) => {
      toggleItem(statuses, code, onStatusesChange)
    },
    [onStatusesChange, statuses]
  )

  const handleOriginToggle = useCallback(
    (code: string) => {
      toggleItem(origins, code, onOriginsChange)
    },
    [onOriginsChange, origins]
  )

  // Calculate active filters count (orderBy is now separate, not counted as filter)
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (ownerMode !== 'me') count++
    if (priority.length > 0) count++
    if (statuses.length > 0) count++
    if (origins.length > 0) count++
    if (daysWithoutInteraction !== null) count++
    if (selectedTags.length > 0) count++
    if (showNextActionFilter && nextActions.length > 0) count++
    return count
  }, [ownerMode, priority, statuses, origins, daysWithoutInteraction, selectedTags, showNextActionFilter, nextActions])

  // Handler for toggling tags
  const handleTagToggle = useCallback(
    (tagId: string) => {
      if (!onTagsChange) return
      toggleItem(selectedTags, tagId, onTagsChange)
    },
    [onTagsChange, selectedTags]
  )

  const handleNextActionToggle = useCallback(
    (code: string) => {
      if (!onNextActionsChange) return
      toggleItem(nextActions, code, onNextActionsChange)
    },
    [nextActions, onNextActionsChange]
  )

  return (
    <>
      {/* Main Filters Popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={activeFiltersCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="h-9 gap-2 px-3"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[480px] p-0" align="start">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Filtros Inteligentes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={onClear} className="h-7 gap-1.5 px-2 text-xs">
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsPopoverOpen(false)} className="h-7 px-2 text-xs">
                  Fechar
                </Button>
              </div>
            </div>

            <Separator />

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
                      <Users className="h-3.5 w-3.5" />
                      {ownerLabel}
                      <ChevronDown className="h-2.5 w-2.5" />
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
                                  {isSelected && <Check className="h-3 w-3" />}
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

            <Separator />

            {/* Prioridade */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Prioridade
              </label>
              <div className="flex bg-muted p-1 rounded-md gap-0.5">
                {PRIORITY_OPTIONS.map(option => {
                  const isActive = priority.includes(option.value)
                  const buttonClass = isActive
                    ? 'flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-all bg-background text-foreground shadow-sm'
                    : 'flex-1 px-3 py-1.5 text-xs font-medium rounded-sm transition-all text-muted-foreground hover:bg-background/50 hover:text-foreground'
                  return (
                    <button
                      key={option.value}
                      onClick={() => handlePriorityToggle(option.value)}
                      className={buttonClass}
                    >
                      {safeString(option.label, option.value)}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

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
                      <ChevronDown className="h-2.5 w-2.5 opacity-50" />
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
                      <ChevronDown className="h-2.5 w-2.5 opacity-50" />
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

            {/* Tags - with Command search */}
            {onTagsChange && (
              <>
                <Separator />
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <TagIcon className="h-3.5 w-3.5" />
                    Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={selectedTags.length > 0 ? 'secondary' : 'outline'}
                        size="sm"
                        className={`h-8 w-full justify-between gap-2 px-3 text-xs ${selectedTags.length > 0 ? 'border-primary/20' : ''}`}
                      >
                        <span className="truncate text-left">
                          {selectedTags.length > 0 
                            ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selecionada${selectedTags.length > 1 ? 's' : ''}`
                            : 'Selecionar tags...'}
                        </span>
                        <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar tag..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Nenhuma tag encontrada</CommandEmpty>
                          <CommandGroup>
                            {availableTags.map(tag => {
                              const safeColor = safeString(tag.color, '#888')
                              const isSelected = selectedTags.includes(tag.id)
                              return (
                                <CommandItem 
                                  key={tag.id} 
                                  onSelect={() => handleTagToggle(tag.id)}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                  <div 
                                    className="h-2.5 w-2.5 rounded-full" 
                                    style={{ backgroundColor: safeColor }}
                                  />
                                  <span>{safeString(tag.name, 'Tag')}</span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <Separator />

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

            {showNextActionFilter && (
              <>
                <Separator />
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Próxima ação
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {NEXT_ACTION_OPTIONS.map(option => {
                      const isSelected = nextActions.includes(option.code)
                      return (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => handleNextActionToggle(option.code)}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                            isSelected ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border hover:bg-muted/60'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                          <span className="truncate text-left">{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
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
          {showNextActionFilter && nextActions.length > 0 && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              Próxima ação ({nextActions.length})
            </Badge>
          )}
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              <TagIcon className="h-3 w-3" />
              {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}
    </>
  )
}
