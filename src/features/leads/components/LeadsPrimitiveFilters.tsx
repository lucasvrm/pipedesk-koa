import { LeadPriorityBucket } from '@/lib/types'
import { safeString } from '@/lib/utils'

interface OptionItem {
  id?: string
  code: string
  label: string
}

interface LeadsPrimitiveFiltersProps {
  // Search
  currentSearch: string
  onSearchChange: (value: string) => void
  // Status
  currentStatus: string
  onStatusChange: (value: string) => void
  leadStatuses: OptionItem[]
  // Origin
  currentOrigin: string
  onOriginChange: (value: string) => void
  leadOrigins: OptionItem[]
  // Priority (for sales view)
  currentPriority?: LeadPriorityBucket | 'all'
  onPriorityChange?: (value: LeadPriorityBucket | 'all') => void
  // Order by (for sales view)
  currentOrderBy?: 'priority' | 'last_interaction' | 'created_at'
  onOrderByChange?: (value: 'priority' | 'last_interaction' | 'created_at') => void
  // Owner mode (for sales view)
  currentOwnerMode?: 'me' | 'all'
  onOwnerModeChange?: (value: 'me' | 'all') => void
  // Clear filters
  onClear?: () => void
  hasActiveFilters?: boolean
}

const PRIORITY_OPTIONS: { value: LeadPriorityBucket | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas Prioridades' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' }
]

const ORDER_BY_OPTIONS: { value: 'priority' | 'last_interaction' | 'created_at'; label: string }[] = [
  { value: 'priority', label: 'Prioridade' },
  { value: 'last_interaction', label: 'Última interação' },
  { value: 'created_at', label: 'Data de criação' }
]

/**
 * LeadsPrimitiveFilters - Stateless filter component using native HTML elements
 * 
 * Uses only <input>, <select>, and <button> to avoid Radix/Shadcn re-render issues.
 * All state is managed externally via props (URL-driven).
 */
export function LeadsPrimitiveFilters({
  currentSearch,
  onSearchChange,
  currentStatus,
  onStatusChange,
  leadStatuses,
  currentOrigin,
  onOriginChange,
  leadOrigins,
  currentPriority,
  onPriorityChange,
  currentOrderBy,
  onOrderByChange,
  currentOwnerMode,
  onOwnerModeChange,
  onClear,
  hasActiveFilters
}: LeadsPrimitiveFiltersProps) {
  
  const selectClassName = "border rounded px-3 py-2 text-sm bg-transparent h-10 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
  const buttonClassName = "border rounded px-3 py-2 text-sm h-10 transition-all hover:bg-muted"
  const activeButtonClassName = "border rounded px-3 py-2 text-sm h-10 bg-primary text-primary-foreground"

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {/* Search Input */}
      <input
        type="text"
        className="border rounded px-3 py-2 text-sm bg-transparent h-10 w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
        placeholder="Buscar..."
        value={currentSearch}
        onChange={e => onSearchChange(e.target.value)}
      />

      {/* Status Select */}
      <select
        className={selectClassName}
        value={currentStatus}
        onChange={e => onStatusChange(e.target.value)}
      >
        <option value="all">Todos os Status</option>
        {leadStatuses.map(status => {
          const optionValue = status.id || status.code
          return (
            <option key={optionValue} value={optionValue}>
              {safeString(status.label, status.code)}
            </option>
          )
        })}
      </select>

      {/* Origin Select */}
      <select
        className={selectClassName}
        value={currentOrigin}
        onChange={e => onOriginChange(e.target.value)}
      >
        <option value="all">Todas as Origens</option>
        {leadOrigins.map(origin => {
          const optionValue = origin.id || origin.code
          return (
            <option key={optionValue} value={optionValue}>
              {safeString(origin.label, origin.code)}
            </option>
          )
        })}
      </select>

      {/* Priority Select (Sales View only) */}
      {onPriorityChange && (
        <select
          className={selectClassName}
          value={currentPriority || 'all'}
          onChange={e => onPriorityChange(e.target.value as LeadPriorityBucket | 'all')}
        >
          {PRIORITY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Order By Select (Sales View only) */}
      {onOrderByChange && (
        <select
          className={selectClassName}
          value={currentOrderBy || 'priority'}
          onChange={e => onOrderByChange(e.target.value as 'priority' | 'last_interaction' | 'created_at')}
        >
          {ORDER_BY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* Owner Mode Buttons (Sales View only) */}
      {onOwnerModeChange && (
        <div className="flex gap-1">
          <button
            type="button"
            className={currentOwnerMode === 'me' ? activeButtonClassName : buttonClassName}
            onClick={() => onOwnerModeChange('me')}
          >
            Meus leads
          </button>
          <button
            type="button"
            className={currentOwnerMode === 'all' ? activeButtonClassName : buttonClassName}
            onClick={() => onOwnerModeChange('all')}
          >
            Todos
          </button>
        </div>
      )}

      {/* Clear Button */}
      {hasActiveFilters && onClear && (
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline px-2"
          onClick={onClear}
        >
          Limpar
        </button>
      )}
    </div>
  )
}
