import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Semantic status colors following the UI/UX audit report
 * Maps semantic meaning to Tailwind CSS classes
 */
export const STATUS_COLORS = {
  success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800',
} as const

export type SemanticStatus = keyof typeof STATUS_COLORS

interface StatusBadgeProps {
  semanticStatus: SemanticStatus
  label: string
  icon?: ReactNode
  className?: string
}

/**
 * StatusBadge component with semantic color mapping
 * 
 * Uses standardized colors from UI/UX audit:
 * - Green: success, active, approved
 * - Blue: info, completed, concluded
 * - Yellow: warning, awaiting, pending
 * - Red: error, cancelled, rejected
 * - Neutral: inactive, draft, default
 * 
 * @example
 * <StatusBadge semanticStatus="success" label="Aprovado" />
 * <StatusBadge semanticStatus="warning" label="Aguardando" icon={<Clock />} />
 */
export function StatusBadge({ semanticStatus, label, icon, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline"
      className={cn(
        STATUS_COLORS[semanticStatus],
        className
      )}
    >
      {icon}
      {label}
    </Badge>
  )
}
