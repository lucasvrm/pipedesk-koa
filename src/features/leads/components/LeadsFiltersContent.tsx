import { useMemo, useCallback, useState, useEffect } from 'react'
import { User, Tag, LeadPriorityBucket } from '@/lib/types'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Users, Check, ChevronDown, Search, X } from 'lucide-react'
import { safeString, ensureArray, cn } from '@/lib/utils'
import { LeadsFilterSection } from './LeadsFilterSection'
import { LeadOrderBy, ORDER_BY_OPTIONS } from './LeadsSmartFilters'

interface OptionItem {
  id?: string
  code: string
  label: string
}

interface CheckboxOption {
  id: string
  label: string
  color?: string
}

/**
 * Canonical list of Next Action options for Sales View.
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

const PRIORITY_OPTIONS: { value: LeadPriorityBucket; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' }
]

const PRIORITY_STYLES: Record<LeadPriorityBucket, { base: string; active: string; pill: string }> = {
  hot: {
    base: 'bg-red-500/10 border-red-500/30',
    active: 'bg-red-500 text-white border-red-500',
    pill: 'bg-red-500 text-white'
  },
  warm: {
    base: 'bg-yellow-300/20 border-yellow-400/40',
    active: 'bg-yellow-300 text-red-700 border-yellow-400',
    pill: 'bg-yellow-300 text-red-700'
  },
  cold: {
    base: 'bg-blue-500/10 border-blue-500/30',
    active: 'bg-blue-500 text-white border-blue-500',
    pill: 'bg-blue-500 text-white'
  }
}

const DAYS_PRESETS = [3, 7, 14] as const

/**
 * Draft filters state for managing changes before applying
 */
export interface DraftFilters {
  ownerMode: 'me' | 'all' | 'custom'
  selectedOwners: string[]
  priority: LeadPriorityBucket[]
  statuses: string[]
  origins: string[]
  daysWithoutInteraction: number | null
  selectedTags: string[]
  nextActions: string[]
  orderBy: LeadOrderBy
}

interface LeadsFiltersContentProps {
  /** Draft filters state */
  draftFilters: DraftFilters
  /** Setter for draft filters */
  setDraftFilters: React.Dispatch<React.SetStateAction<DraftFilters>>
  /** Available users for owner filter */
  users: User[]
  /** Available lead statuses */
  leadStatuses: OptionItem[]
  /** Available lead origins */
  leadOrigins: OptionItem[]
  /** Available tags */
  availableTags?: Tag[]
  /** Show next action filter (only for sales view) */
  showNextActionFilter?: boolean
}

/**
 * LeadsFiltersContent - Shared filter content used by both Sidebar and Sheet
 * 
 * This component renders all the filter inputs/controls without any container.
 * It's designed to be reused in LeadsFiltersSidebar (desktop) and LeadsFiltersSheet (mobile).
 */
export function LeadsFiltersContent({
  draftFilters,
  setDraftFilters,
  users,
  leadStatuses,
  leadOrigins,
  availableTags = [],
  showNextActionFilter = false
}: LeadsFiltersContentProps) {
  // Defensive: ensure arrays are valid
  const safeUsers = ensureArray<User>(users)
  const safeLeadStatuses = ensureArray<OptionItem>(leadStatuses)
  const safeLeadOrigins = ensureArray<OptionItem>(leadOrigins)

  // Convert options to CheckboxOption format
  const statusOptions = useMemo<CheckboxOption[]>(() => 
    safeLeadStatuses
      .filter((s): s is OptionItem & { id: string } => typeof s.id === 'string')
      .map(s => ({ id: s.id, label: safeString(s.label, s.code) })),
    [safeLeadStatuses]
  )

  const originOptions = useMemo<CheckboxOption[]>(() =>
    safeLeadOrigins
      .filter((o): o is OptionItem & { id: string } => typeof o.id === 'string')
      .map(o => ({ id: o.id, label: safeString(o.label, o.code) })),
    [safeLeadOrigins]
  )

  const tagOptions = useMemo<CheckboxOption[]>(() =>
    availableTags.map(t => ({
      id: t.id,
      label: safeString(t.name, 'Tag'),
      color: safeString(t.color, '#888')
    })),
    [availableTags]
  )

  const nextActionOptions = useMemo<CheckboxOption[]>(() =>
    NEXT_ACTION_OPTIONS.map(o => ({ id: o.code, label: o.label })),
    []
  )

  // Local search state for Tags section
  const [tagsSearchQuery, setTagsSearchQuery] = useState('')

  // Reset tags search when available tags change (e.g., company switch)
  useEffect(() => {
    setTagsSearchQuery('')
  }, [availableTags])

  // Filtered tags based on search query
  const filteredTagOptions = useMemo(() =>
    tagOptions.filter(t =>
      t.label.toLowerCase().includes(tagsSearchQuery.toLowerCase())
    ),
    [tagOptions, tagsSearchQuery]
  )

  // Draft owner label for popover trigger
  const draftOwnerLabel = useMemo(() => {
    if (draftFilters.ownerMode === 'me') return 'Meus leads'
    if (draftFilters.ownerMode === 'all') return 'Todos'
    return draftFilters.selectedOwners.length > 0
      ? `${draftFilters.selectedOwners.length} selecionado${draftFilters.selectedOwners.length > 1 ? 's' : ''}`
      : 'Responsável'
  }, [draftFilters.ownerMode, draftFilters.selectedOwners])

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
  }, [setDraftFilters])

  const handleDraftUserSelect = useCallback((userId: string) => {
    setDraftFilters(prev => {
      const newOwners = toggleArrayItem(prev.selectedOwners, userId)
      // If removing last user, fall back to 'all' mode
      if (newOwners.length === 0) {
        return { ...prev, ownerMode: 'all', selectedOwners: [] }
      }
      return { ...prev, ownerMode: 'custom', selectedOwners: newOwners }
    })
  }, [toggleArrayItem, setDraftFilters])

  const handleDraftPriorityToggle = useCallback((bucket: LeadPriorityBucket) => {
    setDraftFilters(prev => ({
      ...prev,
      priority: toggleArrayItem(prev.priority, bucket)
    }))
  }, [toggleArrayItem, setDraftFilters])

  // Handler for single-select days without interaction (clicking same value clears it)
  const handleDaysWithoutInteractionToggle = useCallback((days: number) => {
    setDraftFilters(prev => ({
      ...prev,
      daysWithoutInteraction: prev.daysWithoutInteraction === days ? null : days
    }))
  }, [setDraftFilters])

  const selectionCounts = useMemo(() => {
    const statusCount = draftFilters.statuses.length
    const originCount = draftFilters.origins.length
    const tagCount = draftFilters.selectedTags.length
    const priorityCount = draftFilters.priority.length
    const daysCount = draftFilters.daysWithoutInteraction !== null ? 1 : 0
    const nextActionCount = showNextActionFilter ? draftFilters.nextActions.length : 0
    const ownerCount = draftFilters.ownerMode !== 'all' ? 1 : 0

    return {
      statusCount,
      originCount,
      tagCount,
      priorityCount,
      daysCount,
      nextActionCount,
      ownerCount,
      systemTotal: statusCount + originCount + tagCount + priorityCount + ownerCount,
      activityTotal: daysCount + nextActionCount
    }
  }, [draftFilters, showNextActionFilter])

  const optionRowClassName = 'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background border border-transparent'

  return (
    <div className="space-y-6">
      {/* Ordering Section - Collapsible radio list (only for sales view) */}
      {showNextActionFilter && (
        <LeadsFilterSection
          title="Ordenação"
          defaultOpen={false}
          testId="ordering-section"
          tone="parent"
        >
          <div className="space-y-2" role="radiogroup" aria-label="Ordenação">
            {ORDER_BY_OPTIONS.map(option => {
              const isSelected = draftFilters.orderBy === option.value
              const inputId = `ordering-${option.value}`
              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className={cn(
                    optionRowClassName,
                    isSelected ? 'bg-accent/60 border-border text-foreground' : ''
                  )}
                  data-testid={`ordering-option-${option.value}`}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name="orderBy"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setDraftFilters(prev => ({ ...prev, orderBy: option.value }))}
                    className="sr-only"
                    aria-checked={isSelected}
                  />
                  <div 
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                  </div>
                  <span className="text-sm">{option.label}</span>
                </label>
              )
            })}
          </div>
        </LeadsFilterSection>
      )}

      {/* Section: Filtros do sistema */}
      <LeadsFilterSection
        title="Filtros do sistema"
        defaultOpen={true}
        testId="filter-section-system"
        selectedCount={selectionCounts.systemTotal}
        tone="parent"
      >
        {/* Responsável - Single Popover with Meus/Todos/Users */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            Responsável
            {selectionCounts.ownerCount > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                (1)
              </span>
            )}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 justify-between w-full rounded-lg"
                  data-testid="owner-popover-trigger"
                >
                  <Users className="h-4 w-4" />
                  <span className="truncate flex-1 text-left">{draftOwnerLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform" />
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar usuário..." className="h-9" />
                <CommandList>
                  <CommandEmpty>Nenhum usuário encontrado</CommandEmpty>
                  <CommandGroup heading="Modos">
                    <CommandItem 
                      onSelect={() => handleDraftOwnerModeChange('me')}
                      data-testid="owner-option-my"
                    >
                      <div className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                        draftFilters.ownerMode === 'me' ? 'bg-primary text-primary-foreground' : 'bg-background'
                      )}>
                        {draftFilters.ownerMode === 'me' && <Check className="h-3 w-3" />}
                      </div>
                      <span>Meus leads</span>
                    </CommandItem>
                    <CommandItem 
                      onSelect={() => handleDraftOwnerModeChange('all')}
                      data-testid="owner-option-all"
                    >
                      <div className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                        draftFilters.ownerMode === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background'
                      )}>
                        {draftFilters.ownerMode === 'all' && <Check className="h-3 w-3" />}
                      </div>
                      <span>Todos</span>
                    </CommandItem>
                  </CommandGroup>
                  {safeUsers.length > 0 && (
                    <CommandGroup heading="Usuários">
                      {safeUsers.map(user => {
                        const isSelected = draftFilters.selectedOwners.includes(user.id)
                        return (
                          <CommandItem 
                            key={user.id} 
                            onSelect={() => handleDraftUserSelect(user.id)}
                            data-testid={`owner-option-user-${user.id}`}
                          >
                            <div className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'
                            )}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span>{safeString(user.name, 'Usuário')}</span>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status - Collapsible, minimized by default, no internal scroll */}
        <LeadsFilterSection
          title="Status"
          defaultOpen={false}
          testId="system-status-toggle"
          selectedCount={selectionCounts.statusCount}
        >
          <div className="space-y-1.5">
            {statusOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">Nenhum status disponível</p>
            ) : (
              statusOptions.map(option => {
                const isSelected = draftFilters.statuses.includes(option.id)
                const checkboxId = `status-${option.id}`
                return (
                  <label
                    key={option.id}
                    htmlFor={checkboxId}
                    className={cn(
                      optionRowClassName,
                      isSelected ? 'bg-accent/60 border-border' : ''
                    )}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isSelected}
                      onCheckedChange={() => {
                        const newStatuses = isSelected
                          ? draftFilters.statuses.filter(s => s !== option.id)
                          : [...draftFilters.statuses, option.id]
                        setDraftFilters(prev => ({ ...prev, statuses: newStatuses }))
                      }}
                      data-testid={`status-checkbox-${option.id}`}
                    />
                    <span className="text-sm leading-6">{option.label}</span>
                  </label>
                )
              })
            )}
          </div>
        </LeadsFilterSection>

        {/* Prioridade - with specific colors for Hot/Warm/Cold */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Prioridade
            {selectionCounts.priorityCount > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                ({selectionCounts.priorityCount})
              </span>
            )}
          </label>
          <div className="space-y-1.5">
            {PRIORITY_OPTIONS.map(option => {
              const isActive = draftFilters.priority.includes(option.value)
              const styles = PRIORITY_STYLES[option.value]
              const inputId = `priority-${option.value}`
              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                    isActive
                      ? `${styles.active} shadow-sm ring-1 ring-offset-1 ring-offset-background ring-primary/20`
                      : `${styles.base} hover:opacity-90`
                  )}
                >
                  <Checkbox
                    id={inputId}
                    checked={isActive}
                    onCheckedChange={() => handleDraftPriorityToggle(option.value)}
                    data-testid={`priority-checkbox-${option.value}`}
                  />
                  <span className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full',
                    styles.pill
                  )}>
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Origem - Collapsible, minimized by default */}
        <LeadsFilterSection
          title="Origem"
          defaultOpen={false}
          testId="system-origin-toggle"
          selectedCount={selectionCounts.originCount}
        >
          <div className="space-y-1.5">
            {originOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">Nenhuma origem disponível</p>
            ) : (
              originOptions.map(option => {
                const isSelected = draftFilters.origins.includes(option.id)
                const checkboxId = `origin-${option.id}`
                return (
                  <label
                    key={option.id}
                    htmlFor={checkboxId}
                    className={cn(
                      optionRowClassName,
                      isSelected ? 'bg-accent/60 border-border' : ''
                    )}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isSelected}
                      onCheckedChange={() => {
                        const newOrigins = isSelected
                          ? draftFilters.origins.filter(o => o !== option.id)
                          : [...draftFilters.origins, option.id]
                        setDraftFilters(prev => ({ ...prev, origins: newOrigins }))
                      }}
                      data-testid={`origin-checkbox-${option.id}`}
                    />
                    <span className="text-sm leading-6">{option.label}</span>
                  </label>
                )
              })
            )}
          </div>
        </LeadsFilterSection>

        {/* Tags - Collapsible with search, minimized by default */}
        {availableTags.length > 0 && (
          <LeadsFilterSection
            title="Tags"
            defaultOpen={false}
            testId="system-tags-toggle"
            selectedCount={selectionCounts.tagCount}
          >
            <div className="space-y-2">
              {/* Search input for tags */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar tag..."
                  value={tagsSearchQuery}
                  onChange={e => setTagsSearchQuery(e.target.value)}
                  className="h-9 pl-9 pr-9 text-sm"
                  data-testid="tags-search-input"
                />
                {tagsSearchQuery && (
                  <button
                    type="button"
                    aria-label="Limpar busca de tags"
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    onClick={() => setTagsSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Tag checkboxes */}
              <div className="space-y-1.5">
                {filteredTagOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">Nenhuma tag encontrada</p>
                ) : (
                  filteredTagOptions.map(option => {
                    const isSelected = draftFilters.selectedTags.includes(option.id)
                    const checkboxId = `tag-${option.id}`
                    return (
                      <label
                        key={option.id}
                        htmlFor={checkboxId}
                        className={cn(
                          optionRowClassName,
                          isSelected ? 'bg-accent/60 border-border' : ''
                        )}
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={isSelected}
                          onCheckedChange={() => {
                            const newTags = isSelected
                              ? draftFilters.selectedTags.filter(t => t !== option.id)
                              : [...draftFilters.selectedTags, option.id]
                            setDraftFilters(prev => ({ ...prev, selectedTags: newTags }))
                          }}
                          data-testid={`tag-checkbox-${option.id}`}
                        />
                        {option.color && (
                          <div
                            className="h-2.5 w-2.5 rounded-full border border-border/50 shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span className="text-sm leading-6">{option.label}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </LeadsFilterSection>
        )}
      </LeadsFilterSection>

      {/* Activity Filters Section */}
      <LeadsFilterSection
        title="Atividade do lead"
        defaultOpen={true}
        testId="filter-section-activity"
        selectedCount={selectionCounts.activityTotal}
        tone="parent"
      >
        {/* Dias sem interação - Single select via checkbox, minimized by default */}
        <LeadsFilterSection
          title="Dias sem interação"
          defaultOpen={false}
          testId="activity-days-toggle"
          selectedCount={selectionCounts.daysCount}
        >
          <div className="space-y-1.5">
            {DAYS_PRESETS.map(days => {
              const isSelected = draftFilters.daysWithoutInteraction === days
              const checkboxId = `days-${days}`
              return (
                <label
                  key={days}
                  htmlFor={checkboxId}
                  className={cn(
                    optionRowClassName,
                    isSelected ? 'bg-accent/60 border-border' : ''
                  )}
                >
                  <Checkbox
                    id={checkboxId}
                    checked={isSelected}
                    onCheckedChange={() => handleDaysWithoutInteractionToggle(days)}
                    data-testid={`days-checkbox-${days}`}
                  />
                  <span className="text-sm leading-6">{days}+ dias</span>
                </label>
              )
            })}
          </div>
        </LeadsFilterSection>

        {/* Próxima ação - multiselect, minimized by default, no internal scroll (only for sales view) */}
        {showNextActionFilter && (
          <LeadsFilterSection
            title="Próxima ação"
            defaultOpen={false}
            testId="activity-next-action-toggle"
            selectedCount={selectionCounts.nextActionCount}
          >
            <div className="space-y-1.5">
              {nextActionOptions.map(option => {
                const isSelected = draftFilters.nextActions.includes(option.id)
                const checkboxId = `next-action-${option.id}`
                return (
                  <label
                    key={option.id}
                    htmlFor={checkboxId}
                    className={cn(
                      optionRowClassName,
                      isSelected ? 'bg-accent/60 border-border' : ''
                    )}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isSelected}
                      onCheckedChange={() => {
                        const newActions = isSelected
                          ? draftFilters.nextActions.filter(a => a !== option.id)
                          : [...draftFilters.nextActions, option.id]
                        setDraftFilters(prev => ({ ...prev, nextActions: newActions }))
                      }}
                      data-testid={`next-action-checkbox-${option.id}`}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                )
              })}
            </div>
          </LeadsFilterSection>
        )}
      </LeadsFilterSection>
    </div>
  )
}
