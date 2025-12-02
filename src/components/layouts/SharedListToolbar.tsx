import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SharedListFiltersBar } from './SharedListFiltersBar'

interface SharedListToolbarProps {
  searchField: ReactNode
  filters?: ReactNode
  viewToggle?: ReactNode
  rightContent?: ReactNode
  className?: string
}

export function SharedListToolbar({ searchField, filters, viewToggle, rightContent, className }: SharedListToolbarProps) {
  return (
    <SharedListFiltersBar
      className={className}
      leftContent={
        <div className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          {searchField}
          {filters && <div className={cn('flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto', !viewToggle && 'mb-1')}>{filters}</div>}
          {viewToggle && <div className="flex items-center gap-2 md:ml-auto">{viewToggle}</div>}
        </div>
      }
      rightContent={rightContent}
    />
  )
}
