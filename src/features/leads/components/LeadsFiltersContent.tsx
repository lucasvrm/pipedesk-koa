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
import { Checkbox } from '@/components/ui/checkbox'
import { Users, Check, ChevronDown } from 'lucide-react'
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

  return (
    <div className="space-y-4">
      {/* Ordering Section - Collapsible radio list (only for sales view) */}
      {showNextActionFilter && (
        <>
          <LeadsFilterSection
            title="Ordenação"
            defaultOpen={true}
            testId="ordering-section"
          >
            <div className="space-y-1">
              {ORDER_BY_OPTIONS.map(option => {
                const isSelected = draftFilters.orderBy === option.value
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded transition-colors',
                      isSelected ? 'bg-accent' : 'hover:bg-muted'
                    )}
                    data-testid={`ordering-option-${option.value}`}
                  >
                    <div className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </label>
                )
              })}
            </div>
          </LeadsFilterSection>
          <Separator />
        </>
      )}

      {/* Section: Filtros do sistema */}
      <LeadsFilterSection
        title="Filtros do sistema"
        defaultOpen={true}
        testId="filter-section-system"
      >
        {/* Responsável - Single Popover with Meus/Todos/Users */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Responsável</label>
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 justify-between w-full"
                  data-testid="owner-popover-trigger"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span className="truncate flex-1 text-left">{draftOwnerLabel}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
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
        >
          <div className="space-y-1">
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
        </LeadsFilterSection>

        {/* Prioridade - with specific colors for Hot/Warm/Cold */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
          <div className="space-y-1">
            {PRIORITY_OPTIONS.map(option => {
              const isActive = draftFilters.priority.includes(option.value)
              // Priority-specific styles
              const priorityStyles = {
                hot: {
                  base: 'bg-red-500/10 border-red-500/30',
                  active: 'bg-red-500 text-white border-red-500',
                  pill: 'bg-red-500 text-white'
                },
                warm: {
                  base: 'bg-amber-500/10 border-amber-500/30',
                  active: 'bg-amber-500 text-red-900 border-amber-500',
                  pill: 'bg-amber-500 text-red-900'
                },
                cold: {
                  base: 'bg-blue-500/10 border-blue-500/30',
                  active: 'bg-blue-500 text-white border-blue-500',
                  pill: 'bg-blue-500 text-white'
                }
              }
              const styles = priorityStyles[option.value]
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded border transition-colors',
                    isActive ? styles.active : `${styles.base} hover:opacity-80`
                  )}
                >
                  <Checkbox
                    checked={isActive}
                    onCheckedChange={() => handleDraftPriorityToggle(option.value)}
                    data-testid={`priority-checkbox-${option.value}`}
                  />
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    styles.pill
                  )}>
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Origem - Collapsible, no internal scroll */}
        <LeadsFilterSection
          title="Origem"
          defaultOpen={true}
          testId="system-origin-toggle"
        >
          <div className="space-y-1">
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
        </LeadsFilterSection>

        {/* Tags - Collapsible, minimized by default, no internal scroll */}
        {availableTags.length > 0 && (
          <LeadsFilterSection
            title="Tags"
            defaultOpen={false}
            testId="system-tags-toggle"
          >
            <div className="space-y-1">
              {tagOptions.map(option => {
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
              })}
            </div>
          </LeadsFilterSection>
        )}
      </LeadsFilterSection>

      {/* Activity Filters Section */}
      <LeadsFilterSection
        title="Atividade do lead"
        defaultOpen={true}
        testId="filter-section-activity"
      >
        {/* Dias sem interação - Single select via checkbox, collapsible */}
        <LeadsFilterSection
          title="Dias sem interação"
          defaultOpen={true}
          testId="activity-days-toggle"
        >
          <div className="space-y-1">
            {DAYS_PRESETS.map(days => {
              const isSelected = draftFilters.daysWithoutInteraction === days
              return (
                <label
                  key={days}
                  className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleDaysWithoutInteractionToggle(days)}
                    data-testid={`days-checkbox-${days}`}
                  />
                  <span className="text-sm">{days}+ dias</span>
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
          >
            <div className="space-y-1">
              {nextActionOptions.map(option => {
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
              })}
            </div>
          </LeadsFilterSection>
        )}
      </LeadsFilterSection>
    </div>
  )
}
