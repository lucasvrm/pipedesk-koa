import SearchIcon from "lucide-react/dist/esm/icons/search"
import LayoutListIcon from "lucide-react/dist/esm/icons/layout-list"
import LayoutGridIcon from "lucide-react/dist/esm/icons/layout-grid"
import { ChangeEvent } from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SharedListFiltersBarProps } from "@/components/types/listLayout"

export function SharedListFiltersBar({
  searchValue,
  searchPlaceholder = "Buscar...",
  onSearchChange,
  filters,
  viewMode = "list",
  onViewModeChange,
  toggleLabels = { list: "Lista", grid: "Cards" },
  className,
}: SharedListFiltersBarProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value)
  }

  const hasToggle = typeof onViewModeChange === "function"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 sm:gap-4",
        className
      )}
    >
      <div className="relative min-w-[240px] flex-1 sm:flex-none sm:basis-80">
        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      {filters && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {Array.isArray(filters)
            ? filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2">
                  {filter}
                </div>
              ))
            : filters}
        </div>
      )}

      {hasToggle && (
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(mode) => {
            if (mode) {
              onViewModeChange(mode as typeof viewMode)
            }
          }}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          <ToggleGroupItem value="list" aria-label={toggleLabels.list}>
            <LayoutListIcon className="size-4" />
            <span className="sr-only">{toggleLabels.list}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label={toggleLabels.grid}>
            <LayoutGridIcon className="size-4" />
            <span className="sr-only">{toggleLabels.grid}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    </div>
  )
}
