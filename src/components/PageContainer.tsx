import { ReactNode, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { usePageHeader } from './UnifiedLayout'

interface PageContainerProps {
  children: ReactNode
  className?: string
  title?: ReactNode
  description?: string
  actions?: ReactNode
}

export function PageContainer({ children, className, title, description, actions }: PageContainerProps) {
  const headerContent = useMemo(() => {
    if (!title && !description && !actions) return null

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          {title && (
            typeof title === 'string' ? (
              <h1 className="text-lg font-semibold leading-tight text-foreground">{title}</h1>
            ) : (
              <div className="text-lg font-semibold leading-tight text-foreground">{title}</div>
            )
          )}
          {description && <p className="text-sm text-muted-foreground max-w-3xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 sm:ml-auto">{actions}</div>}
      </div>
    )
  }, [actions, description, title])

  usePageHeader(headerContent)

  return (
    <div
      className={cn(
        "space-y-6 min-w-0 w-full",
        className
      )}
    >
      {children}
    </div>
  )
}
