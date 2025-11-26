import { useMemo } from 'react'
import { PlayerTrack, PlayerStage, STAGE_LABELS } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CalendarBlank, Wallet, User } from '@phosphor-icons/react'

interface DealPlayersKanbanProps {
  tracks: PlayerTrack[]
  currentUser?: any
}

const KANBAN_STAGES: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']

export default function DealPlayersKanban({ tracks, currentUser }: DealPlayersKanbanProps) {
  const navigate = useNavigate()

  // Agrupa os tracks por estágio
  const columns = useMemo(() => {
    const cols: Record<PlayerStage, PlayerTrack[]> = {
      nda: [],
      analysis: [],
      proposal: [],
      negotiation: [],
      closing: []
    }

    tracks.forEach(track => {
      if (cols[track.currentStage]) {
        cols[track.currentStage].push(track)
      }
    })

    return cols
  }, [tracks])

  // Cores das colunas
  const getStageColor = (stage: PlayerStage) => {
    switch (stage) {
      case 'nda': return 'border-t-slate-400'
      case 'analysis': return 'border-t-blue-400'
      case 'proposal': return 'border-t-amber-400'
      case 'negotiation': return 'border-t-purple-400'
      case 'closing': return 'border-t-emerald-400'
      default: return 'border-t-gray-200'
    }
  }

  return (
    // MUDANÇA: Removido overflow-x-auto para evitar scroll horizontal
    <div className="h-[600px] w-full pb-4">
      
      {/* MUDANÇA: w-full para ocupar largura exata, gap reduzido para 2 */}
      <div className="flex h-full w-full gap-2">
        
        {KANBAN_STAGES.map((stage) => {
          const items = columns[stage] || []
          const totalVolume = items.reduce((acc, item) => acc + (item.trackVolume || 0), 0)
          
          return (
            // MUDANÇA: flex-1 para dividir espaço igual, min-w-0 para permitir encolher
            <div key={stage} className="flex flex-col flex-1 min-w-0 bg-muted/30 rounded-lg border border-border/50">
              
              {/* Header da Coluna */}
              <div className={cn("p-2 md:p-3 border-b bg-card rounded-t-lg border-t-4 shadow-sm", getStageColor(stage))}>
                <div className="flex flex-wrap items-center justify-between mb-1 gap-1">
                  <h4 className="font-semibold text-xs md:text-sm uppercase tracking-tight text-foreground/90 truncate">
                    {STAGE_LABELS[stage]}
                  </h4>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                    {items.length}
                  </Badge>
                </div>
                <div className="text-[10px] md:text-xs text-muted-foreground font-medium flex items-center gap-1 truncate">
                  <Wallet className="h-3 w-3 shrink-0" />
                  <span className="truncate">{formatCurrency(totalVolume)}</span>
                </div>
              </div>

              {/* Área de Cards */}
              <ScrollArea className="flex-1 p-1 md:p-2">
                <div className="space-y-2">
                  {items.map((track) => (
                    <Card 
                      key={track.id} 
                      className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary group bg-card"
                      onClick={() => navigate(`/players/${track.id}`)} 
                    >
                      {/* Padding reduzido para caber melhor em larguras pequenas */}
                      <CardContent className="p-2 md:p-3 space-y-2">
                        
                        {/* Título */}
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="text-xs md:text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors break-words">
                            {track.playerName}
                          </h5>
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center text-[10px] md:text-xs text-muted-foreground gap-1.5 overflow-hidden">
                            <Wallet className="h-3 w-3 shrink-0 text-primary/70" />
                            <span className="font-medium text-foreground truncate">
                              {formatCurrency(track.trackVolume)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-[10px] md:text-xs text-muted-foreground gap-1.5 overflow-hidden">
                            <CalendarBlank className="h-3 w-3 shrink-0" />
                            <span className="truncate">{formatDate(track.updatedAt)}</span>
                          </div>
                        </div>

                        {/* Rodapé do Card / Responsáveis */}
                        <div className="pt-2 border-t flex justify-between items-center gap-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-dashed shrink-0">
                            {track.probability}%
                          </Badge>
                          
                          {track.responsibles && track.responsibles.length > 0 && (
                             <div className="flex -space-x-1.5 overflow-hidden">
                               <Avatar className="h-5 w-5 border border-background ring-1 ring-background shrink-0">
                                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                    <User size={10} />
                                  </AvatarFallback>
                               </Avatar>
                             </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 px-2 text-center opacity-50">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Vazio</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    </div>
  )
}