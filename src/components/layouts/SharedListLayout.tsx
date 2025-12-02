import { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SharedListLayoutProps {
  title: string
  description?: string
  primaryAction?: ReactNode
  filtersBar?: ReactNode
  metrics?: ReactNode
  footer?: ReactNode
  children: ReactNode
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
  className
}: SharedListLayoutProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {primaryAction}
      </div>

      {metrics}

      <Card className="border-border/80 shadow-sm">
        {filtersBar && (
          <CardHeader className="pb-4 border-b border-border/60 bg-muted/30 rounded-t-xl">
            {filtersBar}
          </CardHeader>
        )}
        <CardContent className="pt-4 space-y-4">
          {children}
          {footer}
        </CardContent>
      </Card>
    </div>
  )
}
