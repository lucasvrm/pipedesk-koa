import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SharedListFiltersBarProps {
  leftContent: ReactNode
  rightContent?: ReactNode
  className?: string
}

export function SharedListFiltersBar({ leftContent, rightContent, className }: SharedListFiltersBarProps) {
  return (
    <div className={cn('flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center', className)}>
      <div className="flex flex-1 flex-col md:flex-row gap-3 w-full items-center">{leftContent}</div>
      {rightContent && <div className="flex items-center gap-3 shrink-0">{rightContent}</div>}
    </div>
  )
}
