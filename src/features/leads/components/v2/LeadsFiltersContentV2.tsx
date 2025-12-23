import { useMemo, useCallback, useState, useEffect } from 'react'
import { User, Tag, LeadPriorityBucket } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn, safeString, ensureArray } from '@/lib/utils'
import { useFilterSectionsState, FilterSectionKey } from '../../hooks/useFilterSectionsState'
import { LeadOrderBy, ORDER_BY_OPTIONS } from '../LeadsSmartFilters'

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

const PRIORITY_OPTIONS: { value: LeadPriorityBucket; label: string; emoji: string }[] = [
  { value: 'hot', label: 'Hot', emoji: '🔥' },
  { value: 'warm', label: 'Warm', emoji: '☀️' },
  { value: 'cold', label: 'Cold', emoji: '❄️' }
]

const DAYS_PRESETS = [3, 7, 14] as const

/**
 * Draft filters state for managing changes before applying
 */
export interface DraftFiltersV2 {
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

interface LeadsFiltersContentV2Props {
  /** Draft filters state */
  draftFilters: DraftFiltersV2
  /** Setter for draft filters */
  setDraftFilters: React.Dispatch<React.SetStateAction<DraftFiltersV2>>
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
 * Collapsible section component with persistent state
 */
function CollapsibleSection({
  title,
  sectionKey,
  children,
  count = 0
}: {
  title: string
  sectionKey: FilterSectionKey
  children: React.ReactNode
  count?: number
}) {
  const { isCollapsed, toggleSection } = useFilterSectionsState()
  const collapsed = isCollapsed(sectionKey)

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="flex w-full items-center justify-between py-2.5 px-1 text-left hover:bg-muted/50 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid={`section-toggle-${sectionKey}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem] justify-center text-[10px]">
              {count}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            collapsed && '-rotate-90'
          )}
        />
      </button>
      {!collapsed && (
        <div className="pb-3 pt-1 space-y-1" data-testid={`section-content-${sectionKey}`}>
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * LeadsFiltersContentV2 - Compact filter content for V2 sidebar (280px design)
 * 
 * This component renders all the filter inputs/controls with a compact layout.
 * Features:
 * - Collapsible sections with persistent state (localStorage)
 * - Priority pills with colored active states
 * - Compact checkboxes for all options
 * - Search in tags section
 */
export function LeadsFiltersContentV2({
  draftFilters,
  setDraftFilters,
  users,
  leadStatuses,
  leadOrigins,
  availableTags = [],
  showNextActionFilter = false
}: LeadsFiltersContentV2Props) {
  // Defensive: ensure arrays are valid (memoized)
  const safeUsers = useMemo(() => ensureArray<User>(users), [users])
  const safeLeadStatuses = useMemo(() => ensureArray<OptionItem>(leadStatuses), [leadStatuses])
  const safeLeadOrigins = useMemo(() => ensureArray<OptionItem>(leadOrigins), [leadOrigins])

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

  const ownerOptions = useMemo<CheckboxOption[]>(() =>
    safeUsers.map(u => ({ id: u.id, label: safeString(u.name, 'Usuário') })),
    [safeUsers]
  )

  // Local search state for Tags section
  const [tagsSearchQuery, setTagsSearchQuery] = useState('')

  // Reset tags search when available tags change
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

  // Toggle helper for arrays
  const toggleArrayItem = useCallback(<T,>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }, [])

  // Compute counts for sections
  const counts = useMemo(() => ({
    prioridade: draftFilters.priority.length,
    status: draftFilters.statuses.length,
    acao: draftFilters.nextActions.length,
    dias: draftFilters.daysWithoutInteraction !== null ? 1 : 0,
    responsavel: draftFilters.ownerMode !== 'all' ? 1 : 0,
    origem: draftFilters.origins.length,
    tags: draftFilters.selectedTags.length,
    orderBy: draftFilters.orderBy !== 'priority' ? 1 : 0
  }), [draftFilters])

  // Handlers
  const handlePriorityToggle = useCallback((bucket: LeadPriorityBucket) => {
    setDraftFilters(prev => ({
      ...prev,
      priority: toggleArrayItem(prev.priority, bucket)
    }))
  }, [setDraftFilters, toggleArrayItem])

  const handleStatusToggle = useCallback((statusId: string) => {
    setDraftFilters(prev => ({
      ...prev,
      statuses: toggleArrayItem(prev.statuses, statusId)
    }))
  }, [setDraftFilters, toggleArrayItem])

  const handleNextActionToggle = useCallback((code: string) => {
    setDraftFilters(prev => ({
      ...prev,
      nextActions: toggleArrayItem(prev.nextActions, code)
    }))
  }, [setDraftFilters, toggleArrayItem])

  const handleDaysToggle = useCallback((days: number) => {
    setDraftFilters(prev => ({
      ...prev,
      daysWithoutInteraction: prev.daysWithoutInteraction === days ? null : days
    }))
  }, [setDraftFilters])

  const handleOwnerToggle = useCallback((userId: string) => {
    setDraftFilters(prev => {
      const newOwners = toggleArrayItem(prev.selectedOwners, userId)
      // If removing last user, fall back to 'all' mode
      if (newOwners.length === 0) {
        return { ...prev, ownerMode: 'all', selectedOwners: [] }
      }
      return { ...prev, ownerMode: 'custom', selectedOwners: newOwners }
    })
  }, [setDraftFilters, toggleArrayItem])

  const handleOwnerModeToggle = useCallback((mode: 'me' | 'all') => {
    setDraftFilters(prev => ({
      ...prev,
      ownerMode: mode,
      selectedOwners: []
    }))
  }, [setDraftFilters])

  const handleOriginToggle = useCallback((originId: string) => {
    setDraftFilters(prev => ({
      ...prev,
      origins: toggleArrayItem(prev.origins, originId)
    }))
  }, [setDraftFilters, toggleArrayItem])

  const handleTagToggle = useCallback((tagId: string) => {
    setDraftFilters(prev => ({
      ...prev,
      selectedTags: toggleArrayItem(prev.selectedTags, tagId)
    }))
  }, [setDraftFilters, toggleArrayItem])

  const handleOrderByChange = useCallback((orderBy: LeadOrderBy) => {
    setDraftFilters(prev => ({ ...prev, orderBy }))
  }, [setDraftFilters])

  return (
    <div className="space-y-1 p-2">
      {/* Priority Section - Pills */}
      <CollapsibleSection title="Prioridade" sectionKey="prioridade" count={counts.prioridade}>
        <div className="flex gap-2 flex-wrap px-1">
          {PRIORITY_OPTIONS.map(option => {
            const isActive = draftFilters.priority.includes(option.value)
            const styles = {
              hot: {
                active: 'bg-red-900 text-white border-red-900',
                inactive: 'bg-red-50 text-red-900 border-red-200 hover:border-red-400'
              },
              warm: {
                active: 'bg-amber-900 text-white border-amber-900',
                inactive: 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400'
              },
              cold: {
                active: 'bg-blue-900 text-white border-blue-900',
                inactive: 'bg-blue-50 text-blue-900 border-blue-200 hover:border-blue-400'
              }
            }
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePriorityToggle(option.value)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border-2',
                  isActive ? styles[option.value].active : styles[option.value].inactive
                )}
                data-testid={`priority-pill-${option.value}`}
              >
                {option.emoji} {option.label}
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Status Section - Checkboxes */}
      <CollapsibleSection title="Status" sectionKey="status" count={counts.status}>
        <div className="space-y-1">
          {statusOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1 px-2">Nenhum status disponível</p>
          ) : (
            statusOptions.map(option => (
              <label
                key={option.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={draftFilters.statuses.includes(option.id)}
                  onCheckedChange={() => handleStatusToggle(option.id)}
                  data-testid={`status-v2-checkbox-${option.id}`}
                />
                <span className="flex-1">{option.label}</span>
              </label>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Next Action Section - Checkboxes (only for sales view) */}
      {showNextActionFilter && (
        <CollapsibleSection title="Próxima ação" sectionKey="acao" count={counts.acao}>
          <div className="space-y-1">
            {nextActionOptions.map(option => (
              <label
                key={option.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={draftFilters.nextActions.includes(option.id)}
                  onCheckedChange={() => handleNextActionToggle(option.id)}
                  data-testid={`next-action-v2-checkbox-${option.id}`}
                />
                <span className="flex-1">{option.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Days Without Interaction Section - Checkboxes (single select behavior) */}
      <CollapsibleSection title="Dias sem interação" sectionKey="dias" count={counts.dias}>
        <div className="space-y-1">
          {DAYS_PRESETS.map(days => (
            <label
              key={days}
              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
            >
              <Checkbox
                checked={draftFilters.daysWithoutInteraction === days}
                onCheckedChange={() => handleDaysToggle(days)}
                data-testid={`days-v2-checkbox-${days}`}
              />
              <span className="flex-1">{days}+ dias</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Responsável Section - Mode + User Checkboxes */}
      <CollapsibleSection title="Responsável" sectionKey="responsavel" count={counts.responsavel}>
        <div className="space-y-1">
          {/* Mode options */}
          <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm">
            <Checkbox
              checked={draftFilters.ownerMode === 'me'}
              onCheckedChange={() => handleOwnerModeToggle('me')}
              data-testid="owner-v2-me"
            />
            <span className="flex-1">Meus leads</span>
          </label>
          <label className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm">
            <Checkbox
              checked={draftFilters.ownerMode === 'all'}
              onCheckedChange={() => handleOwnerModeToggle('all')}
              data-testid="owner-v2-all"
            />
            <span className="flex-1">Todos</span>
          </label>
          {/* Individual users */}
          {ownerOptions.length > 0 && (
            <div className="border-t mt-2 pt-2">
              <p className="text-xs text-muted-foreground px-2 py-1">Usuários específicos:</p>
              {ownerOptions.map(option => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={draftFilters.selectedOwners.includes(option.id)}
                    onCheckedChange={() => handleOwnerToggle(option.id)}
                    data-testid={`owner-v2-user-${option.id}`}
                  />
                  <span className="flex-1">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Origin Section - Checkboxes */}
      <CollapsibleSection title="Origem" sectionKey="origem" count={counts.origem}>
        <div className="space-y-1">
          {originOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1 px-2">Nenhuma origem disponível</p>
          ) : (
            originOptions.map(option => (
              <label
                key={option.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={draftFilters.origins.includes(option.id)}
                  onCheckedChange={() => handleOriginToggle(option.id)}
                  data-testid={`origin-v2-checkbox-${option.id}`}
                />
                <span className="flex-1">{option.label}</span>
              </label>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Tags Section - Checkboxes with search */}
      {availableTags.length > 0 && (
        <CollapsibleSection title="Tags" sectionKey="tags" count={counts.tags}>
          <div className="space-y-2 px-1">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar tag..."
                value={tagsSearchQuery}
                onChange={e => setTagsSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-8 text-sm border rounded-md bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                data-testid="tags-v2-search-input"
              />
              {tagsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTagsSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca de tags"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Tag checkboxes */}
            <div className="space-y-1">
              {filteredTagOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">Nenhuma tag encontrada</p>
              ) : (
                filteredTagOptions.map(option => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={draftFilters.selectedTags.includes(option.id)}
                      onCheckedChange={() => handleTagToggle(option.id)}
                      data-testid={`tag-v2-checkbox-${option.id}`}
                    />
                    {option.color && (
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className="flex-1">{option.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Order By Section - Radio buttons (only for sales view) */}
      {showNextActionFilter && (
        <CollapsibleSection title="Ordenar por" sectionKey="orderBy" count={counts.orderBy}>
          <div className="space-y-1" role="radiogroup" aria-label="Ordenação">
            {ORDER_BY_OPTIONS.map(option => {
              const isSelected = draftFilters.orderBy === option.value
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors',
                    'hover:bg-muted'
                  )}
                >
                  <input
                    type="radio"
                    name="orderBy"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => handleOrderByChange(option.value)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      isSelected ? 'border-destructive bg-destructive' : 'border-muted-foreground'
                    )}
                  >
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <span className="flex-1">{option.label}</span>
                </label>
              )
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}
