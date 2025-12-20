import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TimelineFilterState } from './types'

interface TimelineHeaderProps {
  filterState: TimelineFilterState
  onFilterChange: (state: TimelineFilterState) => void
  itemsCount: number
}

type FilterOption = TimelineFilterState['activeFilter']

interface FilterButton {
  value: FilterOption
  label: string
}

const filterButtons: FilterButton[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'comment', label: 'Comentários' },
  { value: 'system', label: 'Sistema' }
]

export function TimelineHeader({
  filterState,
  onFilterChange,
  itemsCount
}: TimelineHeaderProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filterState,
      searchQuery: e.target.value
    })
  }

  const handleFilterClick = (filter: FilterOption) => {
    onFilterChange({
      ...filterState,
      activeFilter: filter
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b bg-muted/20">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar no histórico..."
          value={filterState.searchQuery}
          onChange={handleSearchChange}
          className="pl-9 h-9"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filterState.activeFilter === btn.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleFilterClick(btn.value)}
            className="h-7 text-xs px-3"
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Items Counter */}
      <Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">
        {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
      </Badge>
    </div>
  )
}
