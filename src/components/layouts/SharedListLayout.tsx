import { ReactNode } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SharedListLayoutProps {
  title: string
  description?: string
  primaryAction?: ReactNode
  filtersBar?: ReactNode
  metrics?: ReactNode
  footer?: ReactNode
  children: ReactNode
  emptyState?: ReactNode
  className?: string
}

export function SharedListLayout({
  title,
  description,
  primaryAction,
  filtersBar,
  metrics,
  footer,
  children,
  emptyState,
  className
}: SharedListLayoutProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground max-w-3xl">{description}</p>}
        </div>
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
      </div>

      {metrics}

      <Card className="border-border/80 shadow-sm">
        {filtersBar && (
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/30 rounded-t-xl">
            {filtersBar}
          </CardHeader>
        )}
        <CardContent className="pt-4 space-y-4">{emptyState ?? children}</CardContent>
        {footer && (
          <CardFooter className="border-t border-border/60 bg-muted/20 rounded-b-xl py-4">
            <div className="w-full">{footer}</div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
