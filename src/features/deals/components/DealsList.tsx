import { MasterDeal, PlayerTrack, STATUS_LABELS, OPERATION_LABELS, PipelineStage } from '@/lib/types'
import { formatCurrency, formatDate, isOverdue } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { WarningCircle, TrendUp, Buildings, CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface DealsListProps {
  deals: MasterDeal[]
  tracks: PlayerTrack[]
  stages: PipelineStage[] // Recebe estágios dinâmicos
  onDealClick: (deal: MasterDeal) => void
}

export default function DealsList({ deals, tracks, stages, onDealClick }: DealsListProps) {
  
  // Helper para buscar informações do estágio (ID ou Slug)
  const getStageInfo = (stageKey: string): PipelineStage | undefined => {
    if (!stageKey) return undefined;
    return stages.find(s => s.id === stageKey) || 
           stages.find(s => s.name.toLowerCase().replace(/\s/g, '_') === stageKey) ||
           stages.find(s => s.isDefault);
  }

  // Helper para obter destaques do deal (melhor track)
  const getDealHighlights = (dealId: string) => {
    const dealTracks = tracks.filter(t => t.masterDealId === dealId && t.status === 'active')
    if (dealTracks.length === 0) return null

    // Ordena pelo stageOrder do estágio associado
    const bestTrack = [...dealTracks].sort((a, b) => {
      const stageA = getStageInfo(a.currentStage);
      const stageB = getStageInfo(b.currentStage);
      const orderA = stageA ? stageA.stageOrder : -1;
      const orderB = stageB ? stageB.stageOrder : -1;
      return orderB - orderA; // Maior ordem primeiro
    })[0]

    const stageInfo = getStageInfo(bestTrack.currentStage);

    return {
      bestTrack,
      totalTracks: dealTracks.length,
      stageLabel: stageInfo ? stageInfo.name : bestTrack.currentStage,
      progress: stageInfo ? stageInfo.probability : 0
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
                 <Badge variant={deal.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {STATUS_LABELS[deal.status]}
                 </Badge>
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
                                <TrendUp /> {highlights.stageLabel}
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
                        <Avatar key={i} className="h-5 w-5 ring-1 ring-background">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback className="text-[8px]">{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    ))}
                </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}