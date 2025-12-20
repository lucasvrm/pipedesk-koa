import { Search, X, MessageSquare, Mail, Calendar, GitCommit, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TimelineFilterState, TimelineItemType } from './types'

interface TimelineHeaderProps {
  filterState: TimelineFilterState
  onFilterChange: (state: TimelineFilterState) => void
  itemsCount: number
}

interface FilterOption {
  type: TimelineItemType
  label: string
  icon: React.ReactNode
  activeColor: string
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    type: 'comment',
    label: 'Comentários',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    activeColor: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'
  },
  {
    type: 'email',
    label: 'Emails',
    icon: <Mail className="h-3.5 w-3.5" />,
    activeColor: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
  },
  {
    type: 'meeting',
    label: 'Reuniões',
    icon: <Calendar className="h-3.5 w-3.5" />,
    activeColor: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
  },
  {
    type: 'audit',
    label: 'Alterações',
    icon: <GitCommit className="h-3.5 w-3.5" />,
    activeColor: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
  },
  {
    type: 'system',
    label: 'Sistema',
    icon: <Zap className="h-3.5 w-3.5" />,
    activeColor: 'bg-slate-200 text-slate-700 border-slate-400 hover:bg-slate-300'
  }
]

export function TimelineHeader({
  filterState,
  onFilterChange,
  itemsCount
}: TimelineHeaderProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filterState, searchQuery: value })
  }

  const handleTypeToggle = (type: TimelineItemType) => {
    const currentTypes = filterState.activeTypes
    let newTypes: TimelineItemType[]

    if (currentTypes.includes(type)) {
      // Remove type
      newTypes = currentTypes.filter(t => t !== type)
    } else {
      // Add type
      newTypes = [...currentTypes, type]
    }

    onFilterChange({ ...filterState, activeTypes: newTypes })
  }

  const handleClearFilters = () => {
    onFilterChange({ searchQuery: '', activeTypes: [] })
  }

  const hasActiveFilters = filterState.activeTypes.length > 0 || filterState.searchQuery.trim() !== ''

  return (
    <div className="flex-shrink-0 border-b bg-muted/20 p-3 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar no histórico..."
          value={filterState.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {filterState.searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => handleSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter chips (multiselect) */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map((option) => {
          const isActive = filterState.activeTypes.includes(option.type)
          return (
            <Button
              key={option.type}
              variant="outline"
              size="sm"
              onClick={() => handleTypeToggle(option.type)}
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5 transition-colors",
                isActive
                  ? option.activeColor
                  : "bg-background hover:bg-muted"
              )}
            >
              {option.icon}
              {option.label}
            </Button>
          )
        })}

        {/* Clear all button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        )}

        {/* Results count */}
        <Badge variant="secondary" className="ml-auto text-xs">
          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
        </Badge>
      </div>
    </div>
  )
}
