import { User, Tag } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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

/**
 * Canonical list of Next Action options for Sales View (view=sales).
 * These 11 codes are fixed and should NOT be derived from current page data.
 */
const NEXT_ACTION_OPTIONS: { code: string; label: string }[] = [
  { code: 'prepare_for_meeting', label: 'Preparar para reunião' },
  { code: 'post_meeting_follow_up', label: 'Follow-up pós-reunião' },
  { code: 'call_first_time', label: 'Fazer primeira ligação' },
  { code: 'handoff_to_deal', label: 'Fazer handoff (para deal)' },
  { code: 'qualify_to_company', label: 'Qualificar para empresa' },
  { code: 'schedule_meeting', label: 'Agendar reunião' },
  { code: 'call_again', label: 'Ligar novamente' },
  { code: 'send_value_asset', label: 'Enviar material / valor' },
  { code: 'send_follow_up', label: 'Enviar follow-up' },
  { code: 'reengage_cold_lead', label: 'Reengajar lead frio' },
  { code: 'disqualify', label: 'Desqualificar / encerrar' }
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
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [tagSearchTerm, setTagSearchTerm] = useState('')
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
  const selectedTagObjects = useMemo(
    () => availableTags.filter(tag => selectedTags.includes(tag.id)),
    [availableTags, selectedTags]
  )
  const filteredTagOptions = useMemo(() => {
    if (!tagSearchTerm.trim()) return availableTags
    const term = tagSearchTerm.toLowerCase()
    return availableTags.filter(tag => safeString(tag.name, '').toLowerCase().includes(term))
  }, [availableTags, tagSearchTerm])
  const moreFiltersActiveCount = useMemo(() => {
    let count = 0
    if (origins.length > 0) count++
    if (daysWithoutInteraction !== null) count++
    if (showNextActionFilter && nextActions.length > 0) count++
    return count
  }, [daysWithoutInteraction, nextActions, origins, showNextActionFilter])

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
  const activeFilterChips = useMemo(
    () =>
      [
        ownerMode !== 'me' || selectedOwners.length > 0
          ? {
              key: 'owner',
              label: ownerLabel,
              onRemove: () => {
                onOwnerModeChange('me')
                onSelectedOwnersChange([])
              }
            }
          : null,
        priority.length > 0
          ? {
              key: 'priority',
              label: `Prioridade (${priority.length})`,
              onRemove: () => onPriorityChange([])
            }
          : null,
        statuses.length > 0
          ? {
              key: 'statuses',
              label: `Status (${statuses.length})`,
              onRemove: () => onStatusesChange([])
            }
          : null,
        origins.length > 0
          ? {
              key: 'origins',
              label: `Origem (${origins.length})`,
              onRemove: () => onOriginsChange([])
            }
          : null,
        daysWithoutInteraction !== null
          ? {
              key: 'days',
              label: `Dias sem interação: ${daysWithoutInteraction}`,
              onRemove: () => onDaysWithoutInteractionChange(null)
            }
          : null,
        showNextActionFilter && nextActions.length > 0
          ? {
              key: 'nextActions',
              label: `Próxima ação (${nextActions.length})`,
              onRemove: () => onNextActionsChange?.([])
            }
          : null,
        onTagsChange && selectedTags.length > 0
          ? {
              key: 'tags',
              label: `Tags (${selectedTags.length})`,
              onRemove: () => onTagsChange([])
            }
          : null
      ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[],
    [
      daysWithoutInteraction,
      nextActions,
      onNextActionsChange,
      onOriginsChange,
      onOwnerModeChange,
      onPriorityChange,
      onSelectedOwnersChange,
      onStatusesChange,
      onTagsChange,
      origins,
      ownerLabel,
      ownerMode,
      priority,
      selectedOwners,
      selectedTags,
      showNextActionFilter,
      statuses
    ]
  )

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
        <PopoverContent className="w-[520px] p-0" align="start">
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
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

            {activeFilterChips.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo</p>
                <div className="flex flex-wrap gap-2">
                  {activeFilterChips.map(chip => (
                    <Button
                      key={chip.key}
                      variant="secondary"
                      size="sm"
                      className="h-7 gap-1 rounded-full px-2 text-xs"
                      onClick={chip.onRemove}
                      aria-label={`Remover filtro ${chip.label}`}
                    >
                      <span className="truncate max-w-[10rem]">{chip.label}</span>
                      <X className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Essenciais</div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsável</label>
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status {statuses.length > 0 && `(${statuses.length})`}
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={statuses.length > 0 ? 'secondary' : 'outline'}
                          size="sm"
                          className={`h-8 w-full justify-between gap-2 px-3 text-xs ${statuses.length > 0 ? 'border-primary/20' : ''}`}
                        >
                          <span className="truncate">Selecionar status</span>
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Prioridade {priority.length > 0 && `(${priority.length})`}
                    </label>
                    <div className="flex gap-0.5 rounded-md bg-muted p-1">
                      {PRIORITY_OPTIONS.map(option => {
                        const isActive = priority.includes(option.value)
                        const buttonClass = isActive
                          ? 'flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition-all bg-background text-foreground shadow-sm'
                          : 'flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition-all text-muted-foreground hover:bg-background/50 hover:text-foreground'
                        return (
                          <button
                            key={option.value}
                            onClick={() => handlePriorityToggle(option.value)}
                            className={buttonClass}
                            type="button"
                          >
                            {safeString(option.label, option.value)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {onTagsChange && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <TagIcon className="h-3.5 w-3.5" />
                      <span>Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={selectedTags.length > 0 ? 'secondary' : 'outline'}
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => setIsTagDialogOpen(true)}
                      >
                        Selecionar tags...
                      </Button>
                      {selectedTagObjects.slice(0, 3).map(tag => {
                        const safeColor = safeString(tag.color, '#888')
                        return (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="flex items-center gap-1 border px-2 py-1 text-[11px]"
                            style={{ borderColor: safeColor }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: safeColor }}
                            />
                            {safeString(tag.name, 'Tag')}
                          </Badge>
                        )
                      })}
                      {selectedTags.length > selectedTagObjects.length && (
                        <Badge variant="outline" className="h-6 px-2 text-[11px]">
                          +{selectedTags.length - selectedTagObjects.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Collapsible open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Mais filtros {moreFiltersActiveCount > 0 && `(${moreFiltersActiveCount})`}</span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    {isMoreFiltersOpen ? 'Recolher' : 'Mais opções'}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="pt-3">
                <Accordion type="multiple" className="divide-y rounded-md border">
                  <AccordionItem value="tempo">
                    <AccordionTrigger className="px-3 py-3 text-sm font-medium">
                      Tempo
                      {(daysWithoutInteraction !== null || (showNextActionFilter && nextActions.length > 0)) && (
                        <span className="text-muted-foreground">
                          {' '}
                          (
                          {(daysWithoutInteraction !== null ? 1 : 0) +
                            (showNextActionFilter && nextActions.length > 0 ? 1 : 0)}
                          )
                        </span>
                      )}
                    </AccordionTrigger>
                    <AccordionContent className="px-3">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Dias sem interação
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {DAYS_PRESETS.map(days => (
                              <Button
                                key={days}
                                variant={daysWithoutInteraction === days ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 min-w-[3rem] px-3 text-xs"
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
                          <div className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Próxima ação {nextActions.length > 0 && `(${nextActions.length})`}
                            </p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {NEXT_ACTION_OPTIONS.map(option => {
                                const isSelected = nextActions.includes(option.code)
                                return (
                                  <button
                                    key={option.code}
                                    type="button"
                                    onClick={() => handleNextActionToggle(option.code)}
                                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                      isSelected
                                        ? 'border-primary/40 bg-primary/5 text-primary'
                                        : 'border-border hover:bg-muted/60'
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
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="categorizacao">
                    <AccordionTrigger className="px-3 py-3 text-sm font-medium">
                      Categorização {origins.length > 0 && `(${origins.length})`}
                    </AccordionTrigger>
                    <AccordionContent className="px-3">
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Origem</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant={origins.length > 0 ? 'secondary' : 'outline'}
                              size="sm"
                              className={`h-8 w-full justify-between gap-2 px-3 text-xs ${origins.length > 0 ? 'border-primary/20' : ''}`}
                            >
                              <span className="truncate">Selecionar origem</span>
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </PopoverContent>
      </Popover>

      {onTagsChange && (
        <Dialog
          open={isTagDialogOpen}
          onOpenChange={open => {
            setIsTagDialogOpen(open)
            if (!open) setTagSearchTerm('')
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Selecionar tags
              </DialogTitle>
              <DialogDescription>Use tags para refinar a lista sem expandir o popover principal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Command className="rounded-lg border">
                <CommandInput
                  placeholder="Buscar tag..."
                  className="h-9"
                  value={tagSearchTerm}
                  onValueChange={setTagSearchTerm}
                />
                <CommandList className="max-h-[260px]">
                  <CommandEmpty>Nenhuma tag encontrada</CommandEmpty>
                  <CommandGroup>
                    {filteredTagOptions.map(tag => {
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
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: safeColor }} />
                          <span className="truncate">{safeString(tag.name, 'Tag')}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsTagDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
