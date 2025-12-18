import { useMemo, useCallback } from 'react'
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
import { MultiSelectPopover, MultiSelectOption } from '@/components/ui/MultiSelectPopover'
import { Users, Check, ChevronDown, Tag as TagIcon, Clock, MapPin, ArrowUpDown } from 'lucide-react'
import { safeString, ensureArray } from '@/lib/utils'
import { LeadsFilterSection } from './LeadsFilterSection'
import { LeadOrderBy, ORDER_BY_OPTIONS } from './LeadsSmartFilters'

interface OptionItem {
  id?: string
  code: string
  label: string
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

  const nextActionOptions = useMemo<MultiSelectOption[]>(() =>
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

  return (
    <div className="space-y-4">
      {/* Fixed Ordering Section at the top - always accessible (only for sales view) */}
      {showNextActionFilter && (
        <div data-testid="ordering-section-fixed" className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Ordenação</span>
          </div>
          <p className="text-xs text-muted-foreground">Define a ordem da lista.</p>
          <div className="flex flex-wrap gap-2">
            {ORDER_BY_OPTIONS.map(option => (
              <Button
                key={option.value}
                variant={draftFilters.orderBy === option.value ? 'default' : 'outline'}
                size="sm"
                className="h-8"
                onClick={() => setDraftFilters(prev => ({ ...prev, orderBy: option.value }))}
                data-testid={`ordering-option-${option.value}`}
              >
                {option.label}
              </Button>
            ))}
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

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <MultiSelectPopover
            options={statusOptions}
            selected={draftFilters.statuses}
            onSelectionChange={(ids) => setDraftFilters(prev => ({ ...prev, statuses: ids }))}
            placeholder="Selecionar status..."
            searchPlaceholder="Buscar status..."
            emptyText="Nenhum status encontrado"
            clearLabel="Limpar"
            align="start"
          />
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

        {/* Origem */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Origem</label>
          <MultiSelectPopover
            options={originOptions}
            selected={draftFilters.origins}
            onSelectionChange={(ids) => setDraftFilters(prev => ({ ...prev, origins: ids }))}
            placeholder="Selecionar origem..."
            searchPlaceholder="Buscar origem..."
            emptyText="Nenhuma origem encontrada"
            clearLabel="Limpar"
            icon={<MapPin className="h-4 w-4" />}
            align="start"
          />
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Tags</label>
            <MultiSelectPopover
              options={tagOptions}
              selected={draftFilters.selectedTags}
              onSelectionChange={(ids) => setDraftFilters(prev => ({ ...prev, selectedTags: ids }))}
              placeholder="Selecionar tags..."
              searchPlaceholder="Buscar tag..."
              emptyText="Nenhuma tag encontrada"
              clearLabel="Limpar"
              showSelectAll
              selectAllLabel="Selecionar tudo"
              icon={<TagIcon className="h-4 w-4" />}
              align="start"
            />
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

        {/* Próxima ação (only for sales view) */}
        {showNextActionFilter && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Próxima ação</label>
            <MultiSelectPopover
              options={nextActionOptions}
              selected={draftFilters.nextActions}
              onSelectionChange={(ids) => setDraftFilters(prev => ({ ...prev, nextActions: ids }))}
              placeholder="Selecionar ação..."
              searchPlaceholder="Buscar ação..."
              emptyText="Nenhuma ação encontrada"
              clearLabel="Limpar"
              showSelectAll
              selectAllLabel="Selecionar tudo"
              icon={<Clock className="h-4 w-4" />}
              align="start"
              maxHeight="220px"
            />
          </div>
        )}
      </LeadsFilterSection>
    </div>
  )
}
