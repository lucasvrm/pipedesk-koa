import { MasterDeal, PlayerTrack, STAGE_LABELS, OPERATION_LABELS, STATUS_LABELS, PlayerStage } from '@/lib/types'
import { formatCurrency, formatDate, isOverdue } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { dealStatusMap } from '@/lib/statusMaps'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { UserBadge } from '@/components/ui/user-badge'
import { Progress } from '@/components/ui/progress'
import { WarningCircle, TrendUp, Buildings, CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Helpers para cálculo visual
const STAGE_WEIGHTS: Record<PlayerStage, number> = {
  nda: 1, analysis: 2, proposal: 3, negotiation: 4, closing: 5
}
const getStageProgress = (stage: PlayerStage) => {
  const map: Record<PlayerStage, number> = { nda: 15, analysis: 35, proposal: 60, negotiation: 85, closing: 100 }
  return map[stage] || 0
}

interface DealsGridProps {
  deals: MasterDeal[]
  tracks: PlayerTrack[]
  onDealClick: (deal: MasterDeal) => void
}

export function DealsGrid({ deals, tracks, onDealClick }: DealsGridProps) {
  
  // Helper para obter informações do "Melhor Track"
  const getDealHighlights = (dealId: string) => {
    const dealTracks = tracks.filter(t => t.masterDealId === dealId && t.status === 'active')
    if (dealTracks.length === 0) return null

    // Ordena pelo estágio mais avançado
    const bestTrack = [...dealTracks].sort((a, b) => {
      const weightA = STAGE_WEIGHTS[a.currentStage] || 0
      const weightB = STAGE_WEIGHTS[b.currentStage] || 0
      return weightB - weightA
    })[0]

    return {
      bestTrack,
      totalTracks: dealTracks.length,
      progress: getStageProgress(bestTrack.currentStage)
    }
  }

  if (deals.length === 0) {
     return <div className="text-center py-12 text-muted-foreground">Nenhum negócio encontrado.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
      {deals.map(deal => {
        const highlights = getDealHighlights(deal.id)
        const overdue = isOverdue(deal.deadline)

        return (
          <Card 
            key={deal.id} 
            className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between"
            onClick={() => onDealClick(deal)}
          >
            <CardHeader className="p-4 pb-2 space-y-3">
              <div className="flex justify-between items-start">
                 <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground border-slate-200">
                    {OPERATION_LABELS[deal.operationType]}
                 </Badge>
                 <StatusBadge
                   semanticStatus={dealStatusMap(deal.status)}
                   label={STATUS_LABELS[deal.status]}
                   className="text-[10px] h-5"
                 />
              </div>

              <div>
                <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {deal.clientName}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Buildings className="shrink-0" />
                    <span className="truncate">{deal.company?.name || 'Sem empresa'}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0">
               <div className="mb-4">
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-200 block">
                    {formatCurrency(deal.volume)}
                  </span>
               </div>

               {/* Seção Visual de Progresso */}
               <div className="bg-muted/30 p-2 rounded-lg border border-border/40">
                  {highlights ? (
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="font-medium text-primary flex items-center gap-1">
                                <TrendUp /> {STAGE_LABELS[highlights.bestTrack.currentStage]}
                            </span>
                            <span className="text-muted-foreground font-mono">{highlights.progress}%</span>
                        </div>
                        <Progress value={highlights.progress} className="h-1.5" />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                            <span className="truncate max-w-[120px]">{highlights.bestTrack.playerName}</span>
                            {highlights.totalTracks > 1 && <span className="bg-muted px-1 rounded">+{highlights.totalTracks - 1}</span>}
                        </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground italic py-2 text-center">
                        Sem players ativos
                    </div>
                  )}
               </div>
            </CardContent>

            <CardFooter className="p-3 border-t bg-muted/5 flex justify-between items-center">
                <div className={cn("text-[10px] flex items-center gap-1.5 font-medium", overdue ? "text-destructive" : "text-muted-foreground")}>
                    <CalendarBlank />
                    {formatDate(deal.deadline)}
                    {overdue && <WarningCircle weight="fill" />}
                </div>

                <div className="flex -space-x-1.5">
                    {deal.responsibles?.slice(0, 3).map((u, i) => (
                        <UserBadge
                          key={i}
                          name={u.name}
                          avatarUrl={u.avatar}
                          bgColor={u.avatarBgColor}
                          textColor={u.avatarTextColor}
                          borderColor={u.avatarBorderColor}
                          size="xs"
                          className="h-5 w-5 ring-1 ring-background"
                        />
                    ))}
                </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}