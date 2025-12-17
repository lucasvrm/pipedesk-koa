import { User, Tag } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Filter, Users, Check, ChevronDown, X, Tag as TagIcon } from 'lucide-react'
import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
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

// Draft filters state for managing changes before applying
interface DraftFilters {
  ownerMode: 'me' | 'all' | 'custom'
  selectedOwners: string[]
  priority: LeadPriorityBucket[]
  statuses: string[]
  origins: string[]
  daysWithoutInteraction: number | null
  selectedTags: string[]
  nextActions: string[]
}

const PRIORITY_OPTIONS: { value: LeadPriorityBucket; label: string; description: string }[] = [
  { value: 'hot', label: 'Hot', description: 'Score alto, lead muito quente' },
  { value: 'warm', label: 'Warm', description: 'Score moderado, lead engajado' },
  { value: 'cold', label: 'Cold', description: 'Score baixo, lead frio' }
]

export const ORDER_BY_OPTIONS: { value: LeadOrderBy; label: string }[] = [
  { value: 'priority', label: 'Prioridade' },
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
export const NEXT_ACTION_OPTIONS: { code: string; label: string }[] = [
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
 * LeadsSmartFilters - Sheet-based Filter Component for DataToolbar
 * 
 * Uses a Sheet (side panel) with draft mode for a stable UX with many filters.
 * Changes are only applied when the user clicks "Aplicar filtros".
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClear: _onClear,
  availableTags = [],
  selectedTags = [],
  onTagsChange,
  showNextActionFilter = false,
  nextActions = [],
  onNextActionsChange
}: LeadsSmartFiltersProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const wasSheetOpenRef = useRef(false)
  
  // Draft filters state - initialized from applied filters when sheet opens
  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
    ownerMode,
    selectedOwners,
    priority,
    statuses,
    origins,
    daysWithoutInteraction,
    selectedTags,
    nextActions
  })

  // Sync draft with applied only when sheet opens (not while it's open)
  useEffect(() => {
    if (isSheetOpen && !wasSheetOpenRef.current) {
      // Sheet just opened - sync draft from applied
      setDraftFilters({
        ownerMode,
        selectedOwners,
        priority,
        statuses,
        origins,
        daysWithoutInteraction,
        selectedTags,
        nextActions
      })
    }
    wasSheetOpenRef.current = isSheetOpen
  }, [isSheetOpen, ownerMode, selectedOwners, priority, statuses, origins, daysWithoutInteraction, selectedTags, nextActions])

  // Defensive: ensure arrays are valid
  const safeUsers = ensureArray<User>(users)
  const safeLeadStatuses = ensureArray<OptionItem>(leadStatuses)
  const safeLeadOrigins = ensureArray<OptionItem>(leadOrigins)

  // Helper to compute owner label from draft
  const draftOwnerLabel = useMemo(() => {
    if (draftFilters.ownerMode === 'me') return 'Meus leads'
    if (draftFilters.ownerMode === 'all') return 'Todos'
    return draftFilters.selectedOwners.length > 0
      ? `${draftFilters.selectedOwners.length} selecionado${draftFilters.selectedOwners.length > 1 ? 's' : ''}`
      : 'Selecionar'
  }, [draftFilters.ownerMode, draftFilters.selectedOwners])

  // Applied filters owner label for trigger button
  const appliedOwnerLabel = useMemo(() => {
    if (ownerMode === 'me') return 'Meus leads'
    if (ownerMode === 'all') return 'Todos'
    return selectedOwners.length > 0
      ? `${selectedOwners.length} selecionado${selectedOwners.length > 1 ? 's' : ''}`
      : 'Responsável'
  }, [ownerMode, selectedOwners])

  // Calculate active filters count from applied filters
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

  // Draft filters count for display in sheet
  const draftFiltersCount = useMemo(() => {
    let count = 0
    if (draftFilters.ownerMode !== 'me') count++
    if (draftFilters.priority.length > 0) count++
    if (draftFilters.statuses.length > 0) count++
    if (draftFilters.origins.length > 0) count++
    if (draftFilters.daysWithoutInteraction !== null) count++
    if (draftFilters.selectedTags.length > 0) count++
    if (showNextActionFilter && draftFilters.nextActions.length > 0) count++
    return count
  }, [draftFilters, showNextActionFilter])

  // Generate chips from draft filters for summary section
  const draftFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []

    if (draftFilters.ownerMode !== 'me' || draftFilters.selectedOwners.length > 0) {
      chips.push({
        key: 'owner',
        label: draftOwnerLabel,
        onRemove: () => setDraftFilters(prev => ({ ...prev, ownerMode: 'me', selectedOwners: [] }))
      })
    }
    if (draftFilters.priority.length > 0) {
      chips.push({
        key: 'priority',
        label: `Prioridade (${draftFilters.priority.length})`,
        onRemove: () => setDraftFilters(prev => ({ ...prev, priority: [] }))
      })
    }
    if (draftFilters.statuses.length > 0) {
      chips.push({
        key: 'statuses',
        label: `Status (${draftFilters.statuses.length})`,
        onRemove: () => setDraftFilters(prev => ({ ...prev, statuses: [] }))
      })
    }
    if (draftFilters.origins.length > 0) {
      chips.push({
        key: 'origins',
        label: `Origem (${draftFilters.origins.length})`,
        onRemove: () => setDraftFilters(prev => ({ ...prev, origins: [] }))
      })
    }
    if (draftFilters.daysWithoutInteraction !== null) {
      chips.push({
        key: 'days',
        label: `Sem interação há ${draftFilters.daysWithoutInteraction}+ dias`,
        onRemove: () => setDraftFilters(prev => ({ ...prev, daysWithoutInteraction: null }))
      })
    }
    if (showNextActionFilter && draftFilters.nextActions.length > 0) {
      chips.push({
        key: 'nextActions',
        label: `Próxima ação (${draftFilters.nextActions.length})`,
        onRemove: () => setDraftFilters(prev => ({ ...prev, nextActions: [] }))
      })
    }
    if (onTagsChange && draftFilters.selectedTags.length > 0) {
      chips.push({
        key: 'tags',
        label: `Tags (${draftFilters.selectedTags.length})`,
        onRemove: () => setDraftFilters(prev => ({ ...prev, selectedTags: [] }))
      })
    }

    return chips
  }, [draftFilters, draftOwnerLabel, showNextActionFilter, onTagsChange])

  // Toggle helper for arrays
  const toggleArrayItem = useCallback(<T,>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }, [])

  // Draft handlers
  const handleDraftOwnerModeChange = useCallback((mode: 'me' | 'all' | 'custom') => {
    setDraftFilters(prev => ({
      ...prev,
      ownerMode: mode,
      selectedOwners: mode !== 'custom' ? [] : prev.selectedOwners
    }))
  }, [])

  const handleDraftUserSelect = useCallback((userId: string) => {
    setDraftFilters(prev => ({
      ...prev,
      ownerMode: 'custom',
      selectedOwners: toggleArrayItem(prev.selectedOwners, userId)
    }))
  }, [toggleArrayItem])

  const handleDraftPriorityToggle = useCallback((bucket: LeadPriorityBucket) => {
    setDraftFilters(prev => ({
      ...prev,
      priority: toggleArrayItem(prev.priority, bucket)
    }))
  }, [toggleArrayItem])

  const handleDraftStatusToggle = useCallback((statusId: string) => {
    setDraftFilters(prev => ({
      ...prev,
      statuses: toggleArrayItem(prev.statuses, statusId)
    }))
  }, [toggleArrayItem])

  const handleDraftOriginToggle = useCallback((originId: string) => {
    setDraftFilters(prev => ({
      ...prev,
      origins: toggleArrayItem(prev.origins, originId)
    }))
  }, [toggleArrayItem])

  const handleDraftDaysChange = useCallback((days: number | null) => {
    setDraftFilters(prev => ({ ...prev, daysWithoutInteraction: days }))
  }, [])

  const handleDraftTagToggle = useCallback((tagId: string) => {
    setDraftFilters(prev => ({
      ...prev,
      selectedTags: toggleArrayItem(prev.selectedTags, tagId)
    }))
  }, [toggleArrayItem])

  const handleDraftNextActionToggle = useCallback((code: string) => {
    setDraftFilters(prev => ({
      ...prev,
      nextActions: toggleArrayItem(prev.nextActions, code)
    }))
  }, [toggleArrayItem])

  // Clear all draft filters
  const handleClearDraft = useCallback(() => {
    setDraftFilters({
      ownerMode: 'me',
      selectedOwners: [],
      priority: [],
      statuses: [],
      origins: [],
      daysWithoutInteraction: null,
      selectedTags: [],
      nextActions: []
    })
  }, [])

  // Apply filters - commit draft to applied state
  const handleApplyFilters = useCallback(() => {
    onOwnerModeChange(draftFilters.ownerMode)
    onSelectedOwnersChange(draftFilters.selectedOwners)
    onPriorityChange(draftFilters.priority)
    onStatusesChange(draftFilters.statuses)
    onOriginsChange(draftFilters.origins)
    onDaysWithoutInteractionChange(draftFilters.daysWithoutInteraction)
    if (onTagsChange) onTagsChange(draftFilters.selectedTags)
    if (onNextActionsChange) onNextActionsChange(draftFilters.nextActions)
    setIsSheetOpen(false)
  }, [draftFilters, onOwnerModeChange, onSelectedOwnersChange, onPriorityChange, onStatusesChange, onOriginsChange, onDaysWithoutInteractionChange, onTagsChange, onNextActionsChange])

  // Cancel - discard draft and close
  const handleCancel = useCallback(() => {
    setIsSheetOpen(false)
  }, [])

  // Selected tag objects for display
  const selectedTagObjects = useMemo(
    () => availableTags.filter(tag => draftFilters.selectedTags.includes(tag.id)),
    [availableTags, draftFilters.selectedTags]
  )

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant={activeFiltersCount > 0 ? 'secondary' : 'outline'}
        size="sm"
        className="h-9 gap-2 px-3"
        onClick={() => setIsSheetOpen(true)}
      >
        <Filter className="h-4 w-4" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {/* Sheet Panel */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Filtros
                </SheetTitle>
                <SheetDescription>Ajuste os filtros para refinar a lista</SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearDraft}
                className="h-8 gap-1.5 px-2 text-xs"
              >
                Limpar tudo
              </Button>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              {/* Section 1: Summary Chips */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo</p>
                {draftFilterChips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {draftFilterChips.map(chip => (
                      <Button
                        key={chip.key}
                        variant="secondary"
                        size="sm"
                        className="h-7 gap-1 rounded-full px-3 text-xs"
                        onClick={chip.onRemove}
                        aria-label={`Remover filtro ${chip.label}`}
                      >
                        <span className="truncate max-w-[12rem]">{chip.label}</span>
                        <X className="h-3 w-3" />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhum filtro aplicado</p>
                )}
              </div>

              <Separator />

              {/* Section 2: Essential Filters */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Essenciais</p>
                
                {/* Responsável */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Responsável</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={draftFilters.ownerMode === 'me' ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 px-4"
                      onClick={() => handleDraftOwnerModeChange('me')}
                    >
                      Meus
                    </Button>
                    <Button
                      variant={draftFilters.ownerMode === 'all' ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 px-4"
                      onClick={() => handleDraftOwnerModeChange('all')}
                    >
                      Todos
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={draftFilters.ownerMode === 'custom' ? 'default' : 'outline'}
                          size="sm"
                          className="h-9 gap-2 px-3"
                        >
                          <Users className="h-4 w-4" />
                          {draftFilters.ownerMode === 'custom' ? draftOwnerLabel : 'Selecionar'}
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar usuário..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Nenhum usuário encontrado</CommandEmpty>
                            <CommandGroup>
                              {safeUsers.map(user => {
                                const isSelected = draftFilters.selectedOwners.includes(user.id)
                                return (
                                  <CommandItem key={user.id} onSelect={() => handleDraftUserSelect(user.id)}>
                                    <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
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

                {/* Status - Multi-select with Command */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Status {draftFilters.statuses.length > 0 && <span className="text-muted-foreground">({draftFilters.statuses.length} selecionados)</span>}
                  </label>
                  <Command className="rounded-lg border">
                    <CommandInput placeholder="Buscar status..." className="h-9" />
                    <CommandList className="max-h-[160px]">
                      <CommandEmpty>Nenhum status encontrado</CommandEmpty>
                      <CommandGroup>
                        {safeLeadStatuses.map(status => {
                          const isSelected = status.id ? draftFilters.statuses.includes(status.id) : false
                          return (
                            <CommandItem
                              key={status.id}
                              onSelect={() => status.id && handleDraftStatusToggle(status.id)}
                            >
                              <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span>{safeString(status.label, status.code)}</span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                {/* Prioridade - Pill group */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Prioridade {draftFilters.priority.length > 0 && <span className="text-muted-foreground">({draftFilters.priority.length})</span>}
                  </label>
                  <div className="flex gap-1 rounded-lg bg-muted p-1">
                    {PRIORITY_OPTIONS.map(option => {
                      const isActive = draftFilters.priority.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleDraftPriorityToggle(option.value)}
                          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                          }`}
                          type="button"
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Próxima ação - only when view=sales */}
                {showNextActionFilter && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Próxima ação {draftFilters.nextActions.length > 0 && <span className="text-muted-foreground">({draftFilters.nextActions.length})</span>}
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setDraftFilters(prev => ({ ...prev, nextActions: NEXT_ACTION_OPTIONS.map(o => o.code) }))}
                        >
                          Selecionar tudo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setDraftFilters(prev => ({ ...prev, nextActions: [] }))}
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>
                    <Command className="rounded-lg border">
                      <CommandInput placeholder="Buscar ação..." className="h-9" />
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty>Nenhuma ação encontrada</CommandEmpty>
                        <CommandGroup>
                          {NEXT_ACTION_OPTIONS.map(option => {
                            const isSelected = draftFilters.nextActions.includes(option.code)
                            return (
                              <CommandItem
                                key={option.code}
                                onSelect={() => handleDraftNextActionToggle(option.code)}
                              >
                                <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <span>{option.label}</span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 3: Advanced Filters (Accordion) */}
              <Accordion type="multiple" className="w-full" defaultValue={[]}>
                <AccordionItem value="origem">
                  <AccordionTrigger className="text-sm font-medium">
                    Origem {draftFilters.origins.length > 0 && <span className="ml-1 text-muted-foreground">({draftFilters.origins.length})</span>}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Command className="rounded-lg border">
                      <CommandInput placeholder="Buscar origem..." className="h-9" />
                      <CommandList className="max-h-[160px]">
                        <CommandEmpty>Nenhuma origem encontrada</CommandEmpty>
                        <CommandGroup>
                          {safeLeadOrigins.map(origin => {
                            const isSelected = origin.id ? draftFilters.origins.includes(origin.id) : false
                            return (
                              <CommandItem
                                key={origin.id}
                                onSelect={() => origin.id && handleDraftOriginToggle(origin.id)}
                              >
                                <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <span>{safeString(origin.label, origin.code)}</span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="dias">
                  <AccordionTrigger className="text-sm font-medium">
                    Dias sem interação {draftFilters.daysWithoutInteraction !== null && <span className="ml-1 text-muted-foreground">({draftFilters.daysWithoutInteraction}+ dias)</span>}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-muted-foreground mb-3">Sem interação há pelo menos X dias</p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_PRESETS.map(days => (
                        <Button
                          key={days}
                          variant={draftFilters.daysWithoutInteraction === days ? 'default' : 'outline'}
                          size="sm"
                          className="h-9 min-w-[4rem] px-4"
                          onClick={() => handleDraftDaysChange(days)}
                        >
                          {days} dias
                        </Button>
                      ))}
                      <Button
                        variant={draftFilters.daysWithoutInteraction === null ? 'default' : 'outline'}
                        size="sm"
                        className="h-9 px-4"
                        onClick={() => handleDraftDaysChange(null)}
                      >
                        Qualquer
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {onTagsChange && (
                  <AccordionItem value="tags">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <TagIcon className="h-4 w-4" />
                        Tags {draftFilters.selectedTags.length > 0 && <span className="ml-1 text-muted-foreground">({draftFilters.selectedTags.length})</span>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Command className="rounded-lg border">
                        <CommandInput placeholder="Buscar tag..." className="h-9" />
                        <CommandList className="max-h-[160px]">
                          <CommandEmpty>Nenhuma tag encontrada</CommandEmpty>
                          <CommandGroup>
                            {availableTags.map(tag => {
                              const safeColor = safeString(tag.color, '#888')
                              const isSelected = draftFilters.selectedTags.includes(tag.id)
                              return (
                                <CommandItem
                                  key={tag.id}
                                  onSelect={() => handleDraftTagToggle(tag.id)}
                                >
                                  <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                  <div className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: safeColor }} />
                                  <span>{safeString(tag.name, 'Tag')}</span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </ScrollArea>

          {/* Footer with actions */}
          <SheetFooter className="border-t px-6 py-4 flex-shrink-0">
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleApplyFilters}>
                Aplicar filtros {draftFiltersCount > 0 && `(${draftFiltersCount})`}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Badges showing active filters outside the sheet */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {ownerMode === 'custom' && selectedOwners.length > 0 && (
            <Badge variant="secondary" className="h-7 gap-1 px-2 text-xs">
              {appliedOwnerLabel}
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
