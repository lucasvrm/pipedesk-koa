import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SharedListFiltersBarProps {
  leftContent: ReactNode
  rightContent?: ReactNode
  className?: string
}

export function SharedListFiltersBar({ leftContent, rightContent, className }: SharedListFiltersBarProps) {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between', className)}>
      <div className="flex w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center">{leftContent}</div>
      {rightContent && <div className="flex items-center gap-3 self-stretch lg:self-auto shrink-0">{rightContent}</div>}
    </div>
  )
}
