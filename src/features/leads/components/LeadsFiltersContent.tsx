import { useMemo, useCallback, useState } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, Check, ChevronDown, Search, ArrowUpDown, X } from 'lucide-react'
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
  search: string
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

  // Draft owner label
  const draftOwnerLabel = useMemo(() => {
    if (draftFilters.ownerMode === 'me') return 'Meus leads'
    if (draftFilters.ownerMode === 'all') return 'Todos'
    return draftFilters.selectedOwners.length > 0
      ? `${draftFilters.selectedOwners.length} selecionado${draftFilters.selectedOwners.length > 1 ? 's' : ''}`
      : 'Selecionar'
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
    setDraftFilters(prev => ({
      ...prev,
      ownerMode: 'custom',
      selectedOwners: toggleArrayItem(prev.selectedOwners, userId)
    }))
  }, [toggleArrayItem, setDraftFilters])

  const handleDraftPriorityToggle = useCallback((bucket: LeadPriorityBucket) => {
    setDraftFilters(prev => ({
      ...prev,
      priority: toggleArrayItem(prev.priority, bucket)
    }))
  }, [toggleArrayItem, setDraftFilters])

  // Local search state for filtering options within sections (UI-only)
  const [tagsSearchQuery, setTagsSearchQuery] = useState('')
  const [nextActionsSearchQuery, setNextActionsSearchQuery] = useState('')

  // Filtered options for local search
  const filteredTagOptions = useMemo(() => {
    if (!tagsSearchQuery.trim()) return tagOptions
    const query = tagsSearchQuery.toLowerCase()
    return tagOptions.filter(t => t.label.toLowerCase().includes(query))
  }, [tagOptions, tagsSearchQuery])

  const filteredNextActionOptions = useMemo(() => {
    if (!nextActionsSearchQuery.trim()) return nextActionOptions
    const query = nextActionsSearchQuery.toLowerCase()
    return nextActionOptions.filter(o => o.label.toLowerCase().includes(query))
  }, [nextActionOptions, nextActionsSearchQuery])

  // Get current order by label
  const currentOrderByLabel = useMemo(() => {
    const option = ORDER_BY_OPTIONS.find(o => o.value === draftFilters.orderBy)
    return option?.label || 'Prioridade'
  }, [draftFilters.orderBy])

  return (
    <div className="space-y-4">
      {/* Fixed Ordering Section at the top - always accessible (only for sales view) */}
      {showNextActionFilter && (
        <div data-testid="ordering-section-fixed" className="space-y-3">
          {/* Search input + Ordering Popover in a row */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar leads..."
                value={draftFilters.search}
                onChange={(e) => setDraftFilters(prev => ({ ...prev, search: e.target.value }))}
                className="h-8 pl-8 pr-8 text-sm"
                data-testid="filter-search-input"
              />
              {draftFilters.search && (
                <button
                  type="button"
                  onClick={() => setDraftFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Ordering Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 justify-between min-w-[140px]"
                    data-testid="ordering-popover-trigger"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span className="truncate">{currentOrderByLabel}</span>
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                <div className="space-y-0.5">
                  {ORDER_BY_OPTIONS.map(option => {
                    const isSelected = draftFilters.orderBy === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDraftFilters(prev => ({ ...prev, orderBy: option.value }))}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted'
                        )}
                        data-testid={`ordering-option-${option.value}`}
                      >
                        <Check className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                        <span>{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Separator className="mt-4" />
        </div>
      )}

      {/* Section: Filtros definidos pelo sistema */}
      <LeadsFilterSection
        title="Filtros definidos pelo sistema"
        defaultOpen={true}
        testId="filter-section-system"
      >
        {/* Responsável */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Responsável</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={draftFilters.ownerMode === 'me' ? 'default' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => handleDraftOwnerModeChange('me')}
            >
              Meus
            </Button>
            <Button
              variant={draftFilters.ownerMode === 'all' ? 'default' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => handleDraftOwnerModeChange('all')}
            >
              Todos
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex">
                  <Button
                    variant={draftFilters.ownerMode === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 gap-1"
                  >
                    <Users className="h-3.5 w-3.5" />
                    {draftFilters.ownerMode === 'custom' ? draftOwnerLabel : 'Selecionar'}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
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

        {/* Status - Checkbox list */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <div className="space-y-1 max-h-[150px] overflow-y-auto rounded-md border p-2">
            {statusOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">Nenhum status disponível</p>
            ) : (
              statusOptions.map(option => {
                const isSelected = draftFilters.statuses.includes(option.id)
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {
                        const newStatuses = isSelected
                          ? draftFilters.statuses.filter(s => s !== option.id)
                          : [...draftFilters.statuses, option.id]
                        setDraftFilters(prev => ({ ...prev, statuses: newStatuses }))
                      }}
                      data-testid={`status-checkbox-${option.id}`}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>

        {/* Prioridade */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
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

        {/* Origem - Checkbox list */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Origem</label>
          <div className="space-y-1 max-h-[150px] overflow-y-auto rounded-md border p-2">
            {originOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">Nenhuma origem disponível</p>
            ) : (
              originOptions.map(option => {
                const isSelected = draftFilters.origins.includes(option.id)
                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {
                        const newOrigins = isSelected
                          ? draftFilters.origins.filter(o => o !== option.id)
                          : [...draftFilters.origins, option.id]
                        setDraftFilters(prev => ({ ...prev, origins: newOrigins }))
                      }}
                      data-testid={`origin-checkbox-${option.id}`}
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>

        {/* Tags - Checkbox list with local search */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Tags</label>
            <div className="rounded-md border overflow-hidden">
              {/* Local search input for tags */}
              <div className="relative border-b">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar tag..."
                  value={tagsSearchQuery}
                  onChange={(e) => setTagsSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-2 text-sm border-0 rounded-none shadow-none focus-visible:ring-0"
                  data-testid="tags-search-input"
                />
              </div>
              <div className="space-y-1 max-h-[150px] overflow-y-auto p-2">
                {filteredTagOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">Nenhuma tag encontrada</p>
                ) : (
                  filteredTagOptions.map(option => {
                    const isSelected = draftFilters.selectedTags.includes(option.id)
                    return (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted transition-colors"
                      >
                        <Checkbox
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
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span className="text-sm">{option.label}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </LeadsFilterSection>

      {/* Activity Filters Section */}
      <LeadsFilterSection
        title="Atividade do lead"
        defaultOpen={true}
        testId="filter-section-activity"
      >
        {/* Dias sem interação */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Dias sem interação
            {draftFilters.daysWithoutInteraction !== null && (
              <span className="ml-1 text-foreground">({draftFilters.daysWithoutInteraction}+ dias)</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS_PRESETS.map(days => (
              <Button
                key={days}
                variant={draftFilters.daysWithoutInteraction === days ? 'default' : 'outline'}
                size="sm"
                className="h-8 min-w-[4rem]"
                onClick={() => setDraftFilters(prev => ({ ...prev, daysWithoutInteraction: days }))}
              >
                {days} dias
              </Button>
            ))}
            <Button
              variant={draftFilters.daysWithoutInteraction === null ? 'default' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => setDraftFilters(prev => ({ ...prev, daysWithoutInteraction: null }))}
            >
              Qualquer
            </Button>
          </div>
        </div>

        {/* Próxima ação - Checkbox list with local search (only for sales view) */}
        {showNextActionFilter && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Próxima ação</label>
            <div className="rounded-md border overflow-hidden">
              {/* Local search input for next actions */}
              <div className="relative border-b">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar ação..."
                  value={nextActionsSearchQuery}
                  onChange={(e) => setNextActionsSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-2 text-sm border-0 rounded-none shadow-none focus-visible:ring-0"
                  data-testid="next-actions-search-input"
                />
              </div>
              <div className="space-y-1 max-h-[180px] overflow-y-auto p-2">
                {filteredNextActionOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">Nenhuma ação encontrada</p>
                ) : (
                  filteredNextActionOptions.map(option => {
                    const isSelected = draftFilters.nextActions.includes(option.id)
                    return (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted transition-colors"
                      >
                        <Checkbox
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
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </LeadsFilterSection>
    </div>
  )
}
