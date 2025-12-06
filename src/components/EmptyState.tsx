import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  primaryAction?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  // Legacy props for backwards compatibility
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // Support legacy props
  const primary = primaryAction || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined)

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg">
      {icon && (
        <div className="mb-4 text-muted-foreground/50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {(primary || secondaryAction) && (
        <div className="flex gap-2">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primary && (
            <Button onClick={primary.onClick}>
              {primary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
