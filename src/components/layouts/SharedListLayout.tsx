import { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/EmptyState'

interface SharedListLayoutProps {
  title: string
  description?: string
  primaryAction?: ReactNode
  filtersBar?: ReactNode
  metrics?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  // Novas props para UX
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: {
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    icon?: ReactNode
  }
}

export function SharedListLayout({
  title,
  description,
  primaryAction,
  filtersBar,
  metrics,
  footer,
  children,
  className,
  isLoading = false,
  isEmpty = false,
  emptyState
}: SharedListLayoutProps) {
  return (
    <div className={cn('space-y-4 h-full flex flex-col', className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {primaryAction}
      </div>

      {metrics && <div className="shrink-0">{metrics}</div>}

      <Card className="border-border/80 shadow-sm flex-1 flex flex-col overflow-hidden">
        {filtersBar && (
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/30 rounded-t-xl shrink-0">
            {filtersBar}
          </CardHeader>
        )}
        
        <CardContent className="p-0 flex-1 overflow-auto bg-card relative">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty && emptyState ? (
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              actionLabel={emptyState.actionLabel}
              onAction={emptyState.onAction}
              icon={emptyState.icon}
            />
          ) : (
            children
          )}
        </CardContent>

        {footer && !isLoading && !isEmpty && (
          <div className="p-4 border-t border-border/60 bg-muted/10 shrink-0">
            {footer}
          </div>
        )}
      </Card>
    </div>
  )
}