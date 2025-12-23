import { useState } from 'react'
import { Flame, Thermometer, Snowflake, Check, Loader2, Eye, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
    tooltipLabel: 'Alta Prioridade',
    icon: Flame,
    bgClass: 'bg-red-100 dark:bg-red-950/50',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
    hoverClass: 'hover:bg-red-200 dark:hover:bg-red-900/50',
  },
  warm: {
    label: 'Média',
    tooltipLabel: 'Média Prioridade',
    icon: Thermometer,
    bgClass: 'bg-amber-100 dark:bg-amber-950/50',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
    hoverClass: 'hover:bg-amber-200 dark:hover:bg-amber-900/50',
  },
  cold: {
    label: 'Baixa',
    tooltipLabel: 'Baixa Prioridade',
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
  // 1. Hooks - ALWAYS at the top
  const [isOpen, setIsOpen] = useState(false)
  const updatePriority = useUpdateLeadPriority()
  const navigate = useNavigate()

  // 2. Derived values
  const bucket = priorityBucket || 'cold'
  const config = PRIORITY_CONFIG[bucket]
  const Icon = config.icon

  // 3. Handlers
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

  const handleNavigateToDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (leadId) {
      navigate(`/leads/${leadId}`)
    }
    setIsOpen(false)
  }

  // 4. JSX elements
  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full h-10 w-10 p-0 flex items-center justify-center transition-colors',
        config.bgClass,
        config.textClass,
        config.borderClass,
        editable && 'cursor-pointer',
        editable && config.hoverClass,
        className
      )}
    >
      {updatePriority.isPending ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Icon className="h-6 w-6" />
      )}
    </Badge>
  )

  // 5. Conditional returns AFTER hooks
  if (!editable || !leadId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              {badgeContent}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltipLabel}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // 6. Main return
  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild disabled={updatePriority.isPending}>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                {badgeContent}
              </span>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={handleNavigateToDetails}>
              <Eye className="mr-2 h-4 w-4" />
              Detalhes do Lead
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Edit className="mr-2 h-4 w-4" />
                Alterar prioridade
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {PRIORITY_OPTIONS.map((option) => {
                  const optConfig = PRIORITY_CONFIG[option]
                  const OptionIcon = optConfig.icon
                  const isSelected = option === bucket

                  return (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => handleChange(option)}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer transition-colors',
                        'hover:bg-muted',
                        isSelected && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <OptionIcon className={cn('h-5 w-5', optConfig.textClass)} />
                      <span className="flex-1">{optConfig.label}</span>
                      {isSelected && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>
          <p>{config.tooltipLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
