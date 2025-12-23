import { useMemo } from 'react'
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
import { MultiSelectPopover, MultiSelectOption } from '@/components/ui/MultiSelectPopover'
import { Check, ChevronDown, Users, Clock, MapPin, Tag as TagIcon, Filter, X, Flame, Thermometer, Snowflake } from 'lucide-react'
import { LeadPriorityBucket } from '@/lib/types'
import { safeString, ensureArray } from '@/lib/utils'
import { AppliedLeadsFilters, FilterActions } from '../hooks/useLeadsFiltersSearchParams'
import { useLeadTaskTemplates } from '@/hooks/useLeadTaskTemplates'

interface OptionItem {
  id?: string
  code: string
  label: string
}

/**
 * Fallback list of Next Action options for Sales View (view=sales).
 * Used only if API call fails.
 * @deprecated Use dynamic options from useLeadTaskTemplates instead.
 */
const FALLBACK_NEXT_ACTION_OPTIONS: { code: string; label: string }[] = [
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

const PRIORITY_OPTIONS: { value: LeadPriorityBucket; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'hot', label: 'Hot', icon: Flame },
  { value: 'warm', label: 'Warm', icon: Thermometer },
  { value: 'cold', label: 'Cold', icon: Snowflake }
]

const DAYS_PRESETS = [3, 7, 14] as const

interface LeadsFiltersBarProps {
  /** Current applied filters from URL */
  appliedFilters: AppliedLeadsFilters
  /** Actions to update filters */
  actions: FilterActions
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
  /** Active filter count for badge */
  activeFiltersCount: number
}

/**
 * LeadsFiltersBar - Inline Filter Bar with Compact Triggers and Popovers
 * 
 * This component provides an inline filter bar that directly updates the URL.
 * No draft mode - changes are applied immediately.
 */
export function LeadsFiltersBar({
  appliedFilters,
  actions,
  users,
  leadStatuses,
  leadOrigins,
  availableTags = [],
  showNextActionFilter = false,
  activeFiltersCount
}: LeadsFiltersBarProps) {
  // HOOKS: All hooks at the top, before any conditionals (Erro 310 prevention)
  // 1. Data fetching hooks
  const { data: templatesData, isLoading: templatesLoading, isError: templatesError } = useLeadTaskTemplates(false)
  
  // Defensive: ensure arrays are valid
  const safeUsers = ensureArray<User>(users)
  const safeLeadStatuses = ensureArray<OptionItem>(leadStatuses)
  const safeLeadOrigins = ensureArray<OptionItem>(leadOrigins)

  // 2. useMemo hooks
  // Convert options to MultiSelectOption format
  const statusOptions = useMemo<MultiSelectOption[]>(() => 
    safeLeadStatuses
      .filter((s): s is OptionItem & { id: string } => typeof s.id === 'string')
      .map(s => ({ id: s.id, label: safeString(s.label, s.code) })),
    [safeLeadStatuses]
  )

  const originOptions = useMemo<MultiSelectOption[]>(() =>
    safeLeadOrigins
      .filter((o): o is OptionItem & { id: string } => typeof o.id === 'string')
      .map(o => ({ id: o.id, label: safeString(o.label, o.code) })),
    [safeLeadOrigins]
  )

  const tagOptions = useMemo<MultiSelectOption[]>(() =>
    availableTags.map(t => ({
      id: t.id,
      label: safeString(t.name, 'Tag'),
      color: safeString(t.color, '#888')
    })),
    [availableTags]
  )

  // Build next action options dynamically from API or fallback
  const nextActionOptions = useMemo<MultiSelectOption[]>(() => {
    const options: MultiSelectOption[] = [
      { id: '_none', label: 'Sem próxima ação' }
    ]
    
    // Use API data if available, otherwise fallback to hardcoded values
    const templates = templatesData?.data ?? []
    const sourceOptions = templates.length > 0 ? templates : FALLBACK_NEXT_ACTION_OPTIONS
    
    sourceOptions.forEach((template) => {
      options.push({
        id: template.code,
        label: template.label
      })
    })
    
    // Add custom task option at the end
    options.push({ id: '_custom', label: 'Tarefa customizada' })
    
    return options
  }, [templatesData])

  const priorityOptions = useMemo<MultiSelectOption[]>(() =>
    PRIORITY_OPTIONS.map(o => ({ 
      id: o.value, 
      label: o.label,
      icon: o.icon 
    })),
    []
  )

  // Owner label for trigger
  const ownerLabel = useMemo(() => {
    if (appliedFilters.ownerMode === 'me') return 'Meus'
    if (appliedFilters.ownerMode === 'custom' && appliedFilters.ownerIds.length > 0) {
      return `${appliedFilters.ownerIds.length} selecionado${appliedFilters.ownerIds.length > 1 ? 's' : ''}`
    }
    return 'Todos'
  }, [appliedFilters.ownerMode, appliedFilters.ownerIds])

  // 3. Handlers (after all hooks)
  // Handler for user selection in owner popover
  const handleUserSelect = (userId: string) => {
    const isSelected = appliedFilters.ownerIds.includes(userId)
    if (isSelected) {
      const newIds = appliedFilters.ownerIds.filter(id => id !== userId)
      actions.setOwnerIds(newIds)
    } else {
      actions.setOwnerIds([...appliedFilters.ownerIds, userId])
    }
  }

  // Handler for days without interaction
  const handleDaysClick = (days: number | null) => {
    actions.setDaysWithoutInteraction(days)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="leads-filters-bar">
      {/* Responsável (Owner) filter - Segmented + Popover */}
      <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
        <Button
          variant={appliedFilters.ownerMode === 'me' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => actions.setOwnerMode('me')}
        >
          Meus
        </Button>
        <Button
          variant={appliedFilters.ownerMode === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => actions.setOwnerMode('all')}
        >
          Todos
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex">
              <Button
                variant={appliedFilters.ownerMode === 'custom' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
              >
                <Users className="h-3 w-3" />
                {appliedFilters.ownerMode === 'custom' ? ownerLabel : 'Selecionar'}
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
                    const isSelected = appliedFilters.ownerIds.includes(user.id)
                    return (
                      <CommandItem key={user.id} onSelect={() => handleUserSelect(user.id)}>
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

      {/* Status filter */}
      <MultiSelectPopover
        options={statusOptions}
        selected={appliedFilters.status}
        onSelectionChange={(ids) => actions.setMulti('status', ids)}
        placeholder="Status"
        searchPlaceholder="Buscar status..."
        emptyText="Nenhum status encontrado"
        clearLabel="Limpar"
        align="start"
      />

      {/* Priority filter */}
      <MultiSelectPopover
        options={priorityOptions}
        selected={appliedFilters.priority}
        onSelectionChange={(ids) => actions.setMulti('priority', ids as LeadPriorityBucket[])}
        placeholder="Prioridade"
        searchPlaceholder="Buscar..."
        emptyText="Nenhuma opção"
        clearLabel="Limpar"
        align="start"
      />

      {/* Origin filter */}
      <MultiSelectPopover
        options={originOptions}
        selected={appliedFilters.origin}
        onSelectionChange={(ids) => actions.setMulti('origin', ids)}
        placeholder="Origem"
        searchPlaceholder="Buscar origem..."
        emptyText="Nenhuma origem encontrada"
        clearLabel="Limpar"
        icon={<MapPin className="h-3.5 w-3.5" />}
        align="start"
      />

      {/* Tags filter */}
      {availableTags.length > 0 && (
        <MultiSelectPopover
          options={tagOptions}
          selected={appliedFilters.tags}
          onSelectionChange={(ids) => actions.setMulti('tags', ids)}
          placeholder="Tags"
          searchPlaceholder="Buscar tag..."
          emptyText="Nenhuma tag encontrada"
          clearLabel="Limpar"
          showSelectAll
          selectAllLabel="Selecionar tudo"
          icon={<TagIcon className="h-3.5 w-3.5" />}
          align="start"
        />
      )}

      {/* Next Action filter (only for sales view) */}
      {showNextActionFilter && (
        <MultiSelectPopover
          options={nextActionOptions}
          selected={appliedFilters.nextAction}
          onSelectionChange={(ids) => actions.setMulti('nextAction', ids)}
          placeholder={templatesLoading ? 'Carregando...' : 'Próxima ação'}
          searchPlaceholder="Buscar ação..."
          emptyText="Nenhuma ação encontrada"
          clearLabel="Limpar"
          showSelectAll
          selectAllLabel="Selecionar tudo"
          icon={<Clock className="h-3.5 w-3.5" />}
          align="start"
          maxHeight="220px"
          disabled={templatesLoading}
        />
      )}

      {/* Days without interaction - compact dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex">
            <Button
              variant={appliedFilters.daysWithoutInteraction !== null ? 'secondary' : 'outline'}
              size="sm"
              className="h-9 gap-1.5 px-3"
            >
              {appliedFilters.daysWithoutInteraction !== null
                ? `${appliedFilters.daysWithoutInteraction}+ dias`
                : 'Sem interação'
              }
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground px-2 pb-1">Sem interação há:</p>
            <div className="flex gap-1">
              {DAYS_PRESETS.map(days => (
                <Button
                  key={days}
                  variant={appliedFilters.daysWithoutInteraction === days ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 min-w-[4rem]"
                  onClick={() => handleDaysClick(days)}
                >
                  {days} dias
                </Button>
              ))}
              <Button
                variant={appliedFilters.daysWithoutInteraction === null ? 'default' : 'outline'}
                size="sm"
                className="h-8"
                onClick={() => handleDaysClick(null)}
              >
                Qualquer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear all button */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => actions.clearAll()}
        >
          Limpar
          <Badge variant="secondary" className="ml-0.5 h-4 w-4 rounded-full p-0 text-[10px]">
            {activeFiltersCount}
          </Badge>
        </Button>
      )}
    </div>
  )
}

interface LeadsFiltersChipsProps {
  /** Current applied filters from URL */
  appliedFilters: AppliedLeadsFilters
  /** Actions to update filters */
  actions: FilterActions
  /** Lead statuses for label lookup */
  leadStatuses: OptionItem[]
  /** Lead origins for label lookup */
  leadOrigins: OptionItem[]
  /** Tags for label lookup */
  availableTags?: Tag[]
  /** Users for label lookup */
  users?: User[]
  /** Show next action filter chips */
  showNextActionFilter?: boolean
}

/**
 * LeadsFiltersChips - Removable chips for active filters below the toolbar
 */
export function LeadsFiltersChips({
  appliedFilters,
  actions,
  leadStatuses,
  leadOrigins,
  availableTags = [],
  users = [],
  showNextActionFilter = false
}: LeadsFiltersChipsProps) {
  // Collect all active filter chips
  const chips: { key: string; label: string; onRemove: () => void }[] = []

  // Owner chips
  if (appliedFilters.ownerMode === 'me') {
    chips.push({
      key: 'owner-me',
      label: 'Responsável: Meus',
      onRemove: () => actions.setOwnerMode('all')
    })
  } else if (appliedFilters.ownerMode === 'custom' && appliedFilters.ownerIds.length > 0) {
    appliedFilters.ownerIds.forEach(ownerId => {
      const user = users.find(u => u.id === ownerId)
      chips.push({
        key: `owner-${ownerId}`,
        label: `Responsável: ${safeString(user?.name, 'Usuário')}`,
        onRemove: () => {
          const newIds = appliedFilters.ownerIds.filter(id => id !== ownerId)
          actions.setOwnerIds(newIds)
        }
      })
    })
  }

  // Priority chips
  appliedFilters.priority.forEach(p => {
    const label = PRIORITY_OPTIONS.find(o => o.value === p)?.label || p
    chips.push({
      key: `priority-${p}`,
      label: `Prioridade: ${label}`,
      onRemove: () => actions.toggleMulti('priority', p)
    })
  })

  // Status chips
  appliedFilters.status.forEach(statusId => {
    const status = leadStatuses.find(s => s.id === statusId)
    chips.push({
      key: `status-${statusId}`,
      label: `Status: ${safeString(status?.label, statusId)}`,
      onRemove: () => actions.toggleMulti('status', statusId)
    })
  })

  // Origin chips
  appliedFilters.origin.forEach(originId => {
    const origin = leadOrigins.find(o => o.id === originId)
    chips.push({
      key: `origin-${originId}`,
      label: `Origem: ${safeString(origin?.label, originId)}`,
      onRemove: () => actions.toggleMulti('origin', originId)
    })
  })

  // Tags chips
  appliedFilters.tags.forEach(tagId => {
    const tag = availableTags.find(t => t.id === tagId)
    chips.push({
      key: `tag-${tagId}`,
      label: `Tag: ${safeString(tag?.name, tagId)}`,
      onRemove: () => actions.toggleMulti('tags', tagId)
    })
  })

  // Next action chips (only for sales view)
  if (showNextActionFilter) {
    appliedFilters.nextAction.forEach(code => {
      let label = code
      
      // Handle special cases
      if (code === '_none') {
        label = 'Sem próxima ação'
      } else if (code === '_custom') {
        label = 'Tarefa customizada'
      } else {
        // Try to find in fallback options
        const action = FALLBACK_NEXT_ACTION_OPTIONS.find(o => o.code === code)
        label = action?.label || code
      }
      
      chips.push({
        key: `nextAction-${code}`,
        label: `Ação: ${label}`,
        onRemove: () => actions.toggleMulti('nextAction', code)
      })
    })
  }

  // Days without interaction chip
  if (appliedFilters.daysWithoutInteraction !== null) {
    chips.push({
      key: 'days',
      label: `Sem interação há ${appliedFilters.daysWithoutInteraction}+ dias`,
      onRemove: () => actions.setDaysWithoutInteraction(null)
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 pb-3" data-testid="leads-filters-chips">
      <span className="text-xs text-muted-foreground">Filtros ativos:</span>
      {chips.map(chip => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="h-6 gap-1 pl-2 pr-1 text-xs cursor-pointer hover:bg-secondary/80"
          onClick={(e) => {
            e.stopPropagation()
            chip.onRemove()
          }}
        >
          <span className="truncate max-w-[180px]">{chip.label}</span>
          <X className="h-3 w-3" />
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => actions.clearAll()}
        >
          Limpar tudo
        </Button>
      )}
    </div>
  )
}
