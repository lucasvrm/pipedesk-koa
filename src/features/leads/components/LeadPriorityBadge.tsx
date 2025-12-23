import { useState } from 'react'
import { Flame, Thermometer, Snowflake, ChevronDown, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useUpdateLeadPriority } from '../hooks/useUpdateLeadPriority'

type PriorityBucket = 'hot' | 'warm' | 'cold'

interface LeadPriorityBadgeProps {
  leadId?: string
  priorityBucket?: PriorityBucket | null
  priorityScore?: number | null
  priorityDescription?: string | null
  editable?: boolean
  className?: string
}

const PRIORITY_CONFIG = {
  hot: {
    label: 'Alta',
    icon: Flame,
    bgClass: 'bg-red-100 dark:bg-red-950/50',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
    hoverClass: 'hover:bg-red-200 dark:hover:bg-red-900/50',
  },
  warm: {
    label: 'Média',
    icon: Thermometer,
    bgClass: 'bg-amber-100 dark:bg-amber-950/50',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
    hoverClass: 'hover:bg-amber-200 dark:hover:bg-amber-900/50',
  },
  cold: {
    label: 'Baixa',
    icon: Snowflake,
    bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    hoverClass: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
  },
} as const

const PRIORITY_OPTIONS: PriorityBucket[] = ['hot', 'warm', 'cold']

export function LeadPriorityBadge({
  leadId,
  priorityBucket,
  priorityScore,
  priorityDescription,
  editable = false,
  className,
}: LeadPriorityBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const updatePriority = useUpdateLeadPriority()

  const bucket = priorityBucket || 'cold'
  const config = PRIORITY_CONFIG[bucket]
  const Icon = config.icon

  const handleChange = async (newBucket: PriorityBucket) => {
    if (!leadId || newBucket === bucket) {
      setIsOpen(false)
      return
    }

    try {
      await updatePriority.mutateAsync({ leadId, priorityBucket: newBucket })
    } finally {
      setIsOpen(false)
    }
  }

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 px-2 py-0.5 font-medium transition-colors',
        config.bgClass,
        config.textClass,
        config.borderClass,
        editable && 'cursor-pointer',
        editable && config.hoverClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
      {priorityScore != null && (
        <span className="text-xs opacity-70">({priorityScore})</span>
      )}
      {editable && !updatePriority.isPending && (
        <ChevronDown className="h-3 w-3 opacity-50" />
      )}
      {updatePriority.isPending && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
    </Badge>
  )

  // Modo somente leitura
  if (!editable || !leadId) {
    return badgeContent
  }

  // Modo editável
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={updatePriority.isPending}>
        {badgeContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {PRIORITY_OPTIONS.map((option) => {
          const optConfig = PRIORITY_CONFIG[option]
          const OptionIcon = optConfig.icon
          const isSelected = option === bucket

          return (
            <DropdownMenuItem
              key={option}
              onClick={() => handleChange(option)}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                isSelected && 'bg-accent'
              )}
            >
              <OptionIcon className={cn('h-4 w-4', optConfig.textClass)} />
              <span className="flex-1">{optConfig.label}</span>
              {isSelected && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
