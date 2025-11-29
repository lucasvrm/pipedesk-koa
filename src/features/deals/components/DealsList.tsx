import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MasterDeal, STATUS_LABELS, OPERATION_LABELS, PlayerTrack, STAGE_LABELS, PlayerStage } from '@/lib/types'
import { formatCurrency, formatDate, isOverdue, getDaysUntil } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { Eye, WarningCircle, Briefcase, TrendUp } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

// Configuração de Pesos dos Estágios (para determinar o mais avançado)
const STAGE_WEIGHTS: Record<PlayerStage, number> = {
  nda: 1,
  analysis: 2,
  proposal: 3,
  negotiation: 4,
  closing: 5
}

interface DealsListProps {
  deals: MasterDeal[]
  playerTracks?: PlayerTrack[] // Novo Prop Opcional
  compact?: boolean
  bulkMode?: boolean
}

export default function DealsList({ deals, playerTracks = [], compact = false, bulkMode = false }: DealsListProps) {
  const navigate = useNavigate()

  // Agrupamento de Tracks por Deal
  const tracksByDealId = useMemo(() => {
    if (!playerTracks) return {} as Record<string, PlayerTrack[]>;
    return playerTracks.reduce((acc, track) => {
      if (!acc[track.masterDealId]) acc[track.masterDealId] = []
      if (track.status === 'active') acc[track.masterDealId].push(track)
      return acc
    }, {} as Record<string, PlayerTrack[]>)
  }, [playerTracks])

  // Helper para pegar o melhor track
  const getAdvancedTrackInfo = (dealId: string) => {
    const tracks = tracksByDealId[dealId] || []
    if (tracks.length === 0) return null

    const sorted = [...tracks].sort((a, b) => {
      const weightA = STAGE_WEIGHTS[a.currentStage] || 0
      const weightB = STAGE_WEIGHTS[b.currentStage] || 0
      return weightB - weightA
    })

    const bestTrack = sorted[0]
    const extraCount = tracks.length - 1

    return {
      stageLabel: STAGE_LABELS[bestTrack.currentStage],
      playerName: bestTrack.playerName,
      extraCount
    }
  }

  const handleDealClick = (deal: MasterDeal) => {
    if (!bulkMode) {
      navigate(`/deals/${deal.id}`)
    }
  }

  if (deals.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase size={64} weight="duotone" />}
        title="Nenhum deal encontrado"
        description="Não há deals correspondentes aos seus critérios."
      />
    )
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => {
        const overdue = isOverdue(deal.deadline)
        const statusClass = deal.status === 'active' ? 'status-active' :
                           deal.status === 'on_hold' ? 'bg-amber-100 text-amber-700' : '';
        
        const trackInfo = getAdvancedTrackInfo(deal.id)

        return (
          <div
            key={deal.id}
            className={cn(
              "flex flex-col gap-2 p-4 rounded-lg border border-border bg-card transition-all",
              !bulkMode && "hover:bg-secondary/30 cursor-pointer hover:border-primary/20",
              compact && "p-3"
            )}
            onClick={() => handleDealClick(deal)}
          >
            {/* Linha 1: Título e Status */}
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 min-w-0">
                  <h3 className={cn("font-semibold truncate text-foreground", compact ? "text-sm" : "text-base")}>
                    {deal.clientName}
                  </h3>
                  {!compact && (
                    <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5", statusClass)}>
                      {STATUS_LABELS[deal.status]}
                    </Badge>
                  )}
               </div>
               {!compact && !bulkMode && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                   <Eye size={14} />
                 </Button>
               )}
            </div>

            {/* Linha 2: Detalhes (Valor, Tipo, Data) */}
            <div className={cn("flex flex-wrap items-center gap-3 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
              <span className="font-medium text-foreground">{formatCurrency(deal.volume)}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{OPERATION_LABELS[deal.operationType]}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className={cn("flex items-center gap-1", overdue && "text-destructive font-medium")}>
                {formatDate(deal.deadline)}
                {overdue && <WarningCircle weight="fill" />}
              </span>
            </div>

            {/* Linha 3: Track Status (NOVIDADE) */}
            <div className="pt-2 mt-1 border-t border-border/50 flex items-center gap-2">
              {trackInfo ? (
                <>
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-primary/5 border-primary/20 text-primary gap-1">
                    <TrendUp className="w-3 h-3" />
                    {trackInfo.stageLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {trackInfo.playerName}
                  </span>
                  {trackInfo.extraCount > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded-sm">
                      +{trackInfo.extraCount}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground/70 italic">
                  Sem players ativos
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}