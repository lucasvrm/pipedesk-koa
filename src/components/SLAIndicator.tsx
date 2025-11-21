import { useKV } from '@github/spark/hooks'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Clock, Warning, CheckCircle } from '@phosphor-icons/react'
import { PlayerStage, StageHistory } from '../lib/types'
import { differenceInDays, differenceInHours } from 'date-fns'

interface SLAConfigItem {
  stage: PlayerStage
  maxDays: number
  alertThresholdPercent: number
}

interface SLAIndicatorProps {
  playerTrackId: string
  currentStage: PlayerStage
  compact?: boolean
}

export function SLAIndicator({ playerTrackId, currentStage, compact = false }: SLAIndicatorProps) {
  const [slaConfig] = useKV<SLAConfigItem[]>('sla_config', [])
  const [stageHistory] = useKV<StageHistory[]>('stage_history', [])

  // Find the current stage entry for this player track
  const currentStageEntry = (stageHistory ?? []).find(
    h => h.playerTrackId === playerTrackId && h.stage === currentStage && !h.exitedAt
  )

  if (!currentStageEntry) {
    return null
  }

  // Get SLA config for current stage
  const stageSLA = (slaConfig ?? []).find(c => c.stage === currentStage)
  if (!stageSLA) {
    return null
  }

  // Calculate time in current stage
  const enteredAt = new Date(currentStageEntry.enteredAt)
  const now = new Date()
  const hoursInStage = differenceInHours(now, enteredAt)
  const daysInStage = differenceInDays(now, enteredAt)
  
  const maxHours = stageSLA.maxDays * 24
  const alertThresholdHours = maxHours * (stageSLA.alertThresholdPercent / 100)
  
  const percentage = Math.min(100, (hoursInStage / maxHours) * 100)
  const isAtRisk = hoursInStage >= alertThresholdHours
  const isOverdue = hoursInStage >= maxHours

  const getStatusColor = () => {
    if (isOverdue) return 'text-red-600'
    if (isAtRisk) return 'text-amber-600'
    return 'text-green-600'
  }

  const getProgressColor = () => {
    if (isOverdue) return 'bg-red-500'
    if (isAtRisk) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getIcon = () => {
    if (isOverdue) return <Warning className="h-4 w-4" weight="fill" />
    if (isAtRisk) return <Clock className="h-4 w-4" weight="fill" />
    return <CheckCircle className="h-4 w-4" weight="fill" />
  }

  const getStatusText = () => {
    if (isOverdue) return 'Atrasado'
    if (isAtRisk) return 'Em Risco'
    return 'No Prazo'
  }

  const getDaysRemaining = () => {
    const remaining = stageSLA.maxDays - daysInStage
    if (remaining < 0) return `${Math.abs(remaining)}d atrasado`
    if (remaining === 0) return 'Último dia'
    return `${remaining}d restantes`
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`${getStatusColor()} gap-1 border-current`}
            >
              {getIcon()}
              <span>{daysInStage}d</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p className="font-semibold">{getStatusText()}</p>
              <p>{getDaysRemaining()}</p>
              <p className="text-muted-foreground">
                Limite: {stageSLA.maxDays} dias
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={getStatusColor()}>
            {getIcon()}
          </span>
          <span className="font-medium">{getStatusText()}</span>
        </div>
        <span className="text-muted-foreground">
          {daysInStage} / {stageSLA.maxDays} dias
        </span>
      </div>
      
      <Progress 
        value={percentage} 
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{getDaysRemaining()}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}

interface SLAStatusBadgeProps {
  playerTrackId: string
  currentStage: PlayerStage
}

export function SLAStatusBadge({ playerTrackId, currentStage }: SLAStatusBadgeProps) {
  return <SLAIndicator playerTrackId={playerTrackId} currentStage={currentStage} compact />
}
