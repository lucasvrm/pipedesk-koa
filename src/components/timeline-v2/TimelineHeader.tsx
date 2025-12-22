import { useState } from 'react'
import { Search, X, MessageSquare, Mail, Calendar, GitCommit, Zap, ListFilter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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

const ALL_TYPES: TimelineItemType[] = ['comment', 'email', 'meeting', 'audit', 'system']

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
    activeColor: 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(filterState.searchQuery)

  const handleSearchSubmit = () => {
    onFilterChange({ ...filterState, searchQuery: searchValue })
    setSearchOpen(false)
  }

  const handleSearchClear = () => {
    setSearchValue('')
    onFilterChange({ ...filterState, searchQuery: '' })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    } else if (e.key === 'Escape') {
      setSearchOpen(false)
    }
  }

  // Toggle "Todos": se todos estão selecionados, desmarca todos; senão, marca todos
  const handleToggleAll = () => {
    const allSelected = filterState.activeTypes.length === ALL_TYPES.length
    if (allSelected) {
      // Desmarcar todos
      onFilterChange({ ...filterState, activeTypes: [] })
    } else {
      // Marcar todos
      onFilterChange({ ...filterState, activeTypes: [...ALL_TYPES] })
    }
  }

  const handleTypeToggle = (type: TimelineItemType) => {
    const currentTypes = filterState.activeTypes
    let newTypes: TimelineItemType[]

    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type)
    } else {
      newTypes = [...currentTypes, type]
    }

    onFilterChange({ ...filterState, activeTypes: newTypes })
  }

  // "Todos" está ativo quando TODOS os tipos estão selecionados
  const isAllSelected = filterState.activeTypes.length === ALL_TYPES.length
  const hasSearchQuery = filterState.searchQuery.trim() !== ''

  return (
    <div className="flex-shrink-0 border-b bg-muted/20 px-3 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search button with popover */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={hasSearchQuery ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0"
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <div className="text-sm font-medium">Buscar no histórico</div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite para buscar..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                  autoFocus
                />
                {searchValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchValue('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchClear}
                  disabled={!searchValue && !hasSearchQuery}
                >
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSearchSubmit}
                >
                  Buscar
                </Button>
              </div>
              {hasSearchQuery && (
                <div className="text-xs text-muted-foreground">
                  Buscando por: <span className="font-medium text-foreground">"{filterState.searchQuery}"</span>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <div className="w-px h-5 bg-border" />

        {/* "Todos" button - toggle all */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleAll}
          className={cn(
            "h-7 px-2.5 text-xs gap-1.5 transition-colors",
            isAllSelected
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-background hover:bg-muted"
          )}
        >
          <ListFilter className="h-3.5 w-3.5" />
          Todos
        </Button>

        {/* Filter chips */}
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

        {/* Results count */}
        <Badge variant="secondary" className="ml-auto text-xs">
          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
        </Badge>
      </div>
    </div>
  )
}
