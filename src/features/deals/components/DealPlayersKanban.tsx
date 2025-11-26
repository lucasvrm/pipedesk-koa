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

  // Group tracks by stage
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

  // Column colors
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
    <div className="h-[600px] w-full overflow-x-auto pb-4">
      <div className="flex h-full min-w-[1000px] gap-4">
        {KANBAN_STAGES.map((stage) => {
          const items = columns[stage] || []
          const totalVolume = items.reduce((acc, item) => acc + (item.trackVolume || 0), 0)
          
          return (
            <div key={stage} className="flex flex-col w-1/5 min-w-[260px] bg-muted/30 rounded-lg border border-border/50">
              {/* Header */}
              <div className={cn("p-3 border-b bg-card rounded-t-lg border-t-4 shadow-sm", getStageColor(stage))}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm uppercase tracking-tight text-foreground/90">
                    {STAGE_LABELS[stage]}
                  </h4>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                    {items.length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  {formatCurrency(totalVolume)}
                </div>
              </div>

              {/* Cards Area */}
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-2.5">
                  {items.map((track) => (
                    <Card 
                      key={track.id} 
                      className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary group bg-card"
                      onClick={() => navigate(`/players/${track.id}`)} 
                    >
                      <CardContent className="p-3 space-y-2.5">
                        {/* Title */}
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {track.playerName}
                          </h5>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-primary/70" />
                            <span className="font-medium text-foreground">
                              {formatCurrency(track.trackVolume)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                            <CalendarBlank className="h-3.5 w-3.5" />
                            <span>{formatDate(track.updatedAt)}</span>
                          </div>
                        </div>

                        {/* Footer / Responsibles */}
                        <div className="pt-2 border-t flex justify-between items-center">
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-dashed">
                            {track.probability}% Prob.
                          </Badge>
                          
                          {track.responsibles && track.responsibles.length > 0 && (
                             <div className="flex -space-x-1.5">
                               {/* Ideally map real users, showing simplified placeholders for now */}
                               <Avatar className="h-5 w-5 border border-background ring-1 ring-background">
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
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center opacity-50">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground">Sem players</p>
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