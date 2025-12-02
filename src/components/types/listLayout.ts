import { ReactNode } from "react"

export type ListViewMode = "list" | "grid"

export interface ListPaginationConfig {
  onPrevious: () => void
  onNext: () => void
  disablePrevious?: boolean
  disableNext?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  viewMode?: ListViewMode
  itemsLabel?: string
}

export interface SharedListLayoutProps {
  title: ReactNode
  primaryActions?: ReactNode
  filtersBar?: ReactNode
  children: ReactNode
  pagination?: ListPaginationConfig
  className?: string
  contentClassName?: string
}

export interface SharedListFiltersBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode | ReactNode[]
  viewMode?: ListViewMode
  onViewModeChange?: (mode: ListViewMode) => void
  toggleLabels?: { list: string; grid: string }
  className?: string
}

export const ACTIONS_COLUMN_CLASSNAME = "text-left"
