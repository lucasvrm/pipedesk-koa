import { cn, safeString } from '@/lib/utils'
import { Check, Circle } from 'lucide-react'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import type { LeadStatusMeta } from '@/types/metadata'

interface LeadStatusBreadcrumbsProps {
  /** The current lead's status ID */
  currentStatusId: string
  /** Optional callback when a status is clicked */
  onStatusClick?: (statusId: string) => void
  /** Whether the component is read-only (disables click actions) */
  readOnly?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * LeadStatusBreadcrumbs - Dynamic lead status breadcrumbs component
 * 
 * Displays lead statuses as visual progress indicators, loaded from the backend
 * via the useSystemMetadata hook (from /api/settings/lead-statuses).
 * 
 * Styling:
 * - Current status: highlighted card with tick icon
 * - Past statuses: completed cards with check icons  
 * - Future statuses: disabled/muted cards
 */
export function LeadStatusBreadcrumbs({
  currentStatusId,
  onStatusClick,
  readOnly = false,
  className
}: LeadStatusBreadcrumbsProps) {
  const { leadStatuses, isLoading } = useSystemMetadata()

  // Filter active statuses and ensure proper sort order for display
  const activeStatuses = leadStatuses
    .filter((status: LeadStatusMeta) => status.isActive)
    .sort((a: LeadStatusMeta, b: LeadStatusMeta) => a.sortOrder - b.sortOrder)

  // Find the index of the current status
  const currentIndex = activeStatuses.findIndex(
    (status: LeadStatusMeta) => status.id === currentStatusId
  )

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 w-24 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    )
  }

  if (activeStatuses.length === 0) {
    return null
  }

  return (
    <div className={cn("w-full overflow-x-auto pb-2 scrollbar-hide", className)}>
      <div className="flex items-center min-w-max gap-1">
        {activeStatuses.map((status: LeadStatusMeta, index: number) => {
          const isPast = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex

          return (
            <div key={status.id} className="flex items-center">
              {/* Status Card */}
              <div
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200",
                  "select-none min-w-[100px] justify-center",
                  // Current status - highlighted with tick
                  isCurrent && [
                    "bg-primary text-primary-foreground font-semibold",
                    "shadow-md ring-2 ring-primary/30 scale-105 z-10"
                  ],
                  // Past status - completed with check
                  isPast && [
                    "bg-green-600 text-white cursor-pointer",
                    !readOnly && "hover:bg-green-700"
                  ],
                  // Future status - disabled/muted
                  isFuture && [
                    "bg-muted text-muted-foreground",
                    !readOnly && "cursor-pointer hover:bg-muted/80"
                  ],
                  // Read-only mode
                  readOnly && "cursor-default pointer-events-none"
                )}
                onClick={() => {
                  if (!readOnly && onStatusClick) {
                    onStatusClick(status.id)
                  }
                }}
                role="button"
                tabIndex={readOnly ? -1 : 0}
                aria-label={`Status: ${safeString(status.label, status.code)}`}
                aria-current={isCurrent ? 'step' : undefined}
                onKeyDown={(e) => {
                  if (!readOnly && onStatusClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onStatusClick(status.id)
                  }
                }}
              >
                {/* Icon */}
                <span className="flex-shrink-0">
                  {isCurrent && <Check className="h-4 w-4" strokeWidth={3} />}
                  {isPast && <Check className="h-4 w-4" strokeWidth={2} />}
                  {isFuture && <Circle className="h-4 w-4" strokeWidth={1.5} />}
                </span>

                {/* Label */}
                <span className="text-sm whitespace-nowrap">
                  {safeString(status.label, status.code)}
                </span>
              </div>

              {/* Connector line between cards (except for last item) */}
              {index < activeStatuses.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-0.5 mx-0.5",
                    index < currentIndex ? "bg-green-600" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
