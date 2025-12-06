import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { isUpdatedToday, isNew } from '@/utils/dateUtils'

/**
 * Props for activity badge components
 */
interface ActivityBadgeProps {
  className?: string
  icon?: ReactNode
}

/**
 * Badge to indicate an item was updated today
 */
export function UpdatedTodayBadge({ className, icon }: ActivityBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      {icon}
      Atualizado hoje
    </Badge>
  )
}

/**
 * Badge to indicate a new item (created within last 24 hours)
 */
export function NewBadge({ className, icon }: ActivityBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      {icon}
      Novo
    </Badge>
  )
}

/**
 * Renders "Atualizado hoje" badge if the entity was updated today
 * @param updatedAt - The updated timestamp
 * @param className - Optional CSS classes
 * @param icon - Optional icon to display
 * @returns Badge component or null
 */
export function renderUpdatedTodayBadge(
  updatedAt: string | Date | undefined,
  className?: string,
  icon?: ReactNode
): ReactNode {
  if (!isUpdatedToday(updatedAt)) return null
  
  return <UpdatedTodayBadge className={className} icon={icon} />
}

/**
 * Renders "Novo" badge if the entity was created within last 24 hours
 * @param createdAt - The created timestamp
 * @param className - Optional CSS classes
 * @param icon - Optional icon to display
 * @returns Badge component or null
 */
export function renderNewBadge(
  createdAt: string | Date | undefined,
  className?: string,
  icon?: ReactNode
): ReactNode {
  if (!isNew(createdAt)) return null
  
  return <NewBadge className={className} icon={icon} />
}
