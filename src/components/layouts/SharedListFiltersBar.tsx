import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SharedListFiltersBarProps {
  leftContent: ReactNode // Busca, Filtros, Toggle
  rightContent?: ReactNode // Ações em lote, etc
  className?: string
}

export function SharedListFiltersBar({ leftContent, rightContent, className }: SharedListFiltersBarProps) {
  return (
    <div className={cn('flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center', className)}>
      <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full items-center flex-wrap">
        {leftContent}
      </div>
      {rightContent && (
        <div className="flex items-center gap-3 shrink-0 ml-auto lg:ml-0">
          {rightContent}
        </div>
      )}
    </div>
  )
}