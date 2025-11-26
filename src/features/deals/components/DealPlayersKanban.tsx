import { useMemo, useState } from 'react'
import { PlayerTrack, PlayerStage, STAGE_LABELS } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CalendarBlank, Wallet, User } from '@phosphor-icons/react'
import { useUpdateTrack } from '@/services/trackService' // Hook de mutação
import { toast } from 'sonner'

interface DealPlayersKanbanProps {
  tracks: PlayerTrack[]
  currentUser?: any
}

const KANBAN_STAGES: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']

export default function DealPlayersKanban({ tracks, currentUser }: DealPlayersKanbanProps) {
  const navigate = useNavigate()
  const updateTrack = useUpdateTrack()
  
  // Estado para controlar o item sendo arrastado
  const [draggedTrack, setDraggedTrack] = useState<PlayerTrack | null>(null)
  // Estado para controlar visualmente a coluna alvo (hover)
  const [dragOverStage, setDragOverStage] = useState<PlayerStage | null>(null)

  // Agrupa os tracks por estágio (useMemo para performance)
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

  // --- HANDLERS DE DRAG AND DROP ---

  const handleDragStart = (track: PlayerTrack) => {
    setDraggedTrack(track)
  }

  const handleDragOver = (e: React.DragEvent, stage: PlayerStage) => {
    e.preventDefault() // Necessário para permitir o Drop
    if (dragOverStage !== stage) {
      setDragOverStage(stage)
    }
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = (targetStage: PlayerStage) => {
    setDragOverStage(null) // Limpa o highlight

    if (!draggedTrack) return
    if (draggedTrack.currentStage === targetStage) return // Não faz nada se soltar na mesma coluna

    // Chama a API para atualizar
    updateTrack.mutate({
      trackId: draggedTrack.id,
      updates: { currentStage: targetStage }
    }, {
      onSuccess: () => {
        toast.success(`Movido para ${STAGE_LABELS[targetStage]}`)
      },
      onError: () => {
        toast.error("Erro ao mover o player")
      }
    })
    
    setDraggedTrack(null)
  }

  // --- HELPER DE CORES ---
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
    <div className="h-[600px] w-full pb-4">
      <div className="flex h-full w-full gap-2">
        
        {KANBAN_STAGES.map((stage) => {
          const items = columns[stage] || []
          const totalVolume = items.reduce((acc, item) => acc + (item.trackVolume || 0), 0)
          const isDragOver = dragOverStage === stage
          
          return (
            <div 
              key={stage} 
              // Eventos de Drop na Coluna inteira
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage)}
              className={cn(
                "flex flex-col flex-1 min-w-0 rounded-lg border transition-colors duration-200",
                // Estilo condicional quando um card está "sobrevoando" a coluna
                isDragOver 
                  ? "bg-primary/10 border-primary border-dashed" 
                  : "bg-muted/30 border-border/50"
              )}
            >
              
              {/* Header da Coluna */}
              <div className={cn("p-2 md:p-3 border-b bg-card rounded-t-lg border-t-4 shadow-sm select-none", getStageColor(stage))}>
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
                    <div
                      key={track.id}
                      draggable // Habilita o arraste
                      onDragStart={() => handleDragStart(track)}
                      className={cn(
                        "transition-opacity",
                        // Diminui opacidade do card original enquanto arrasta
                        draggedTrack?.id === track.id ? "opacity-50" : "opacity-100"
                      )}
                    >
                      <Card 
                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary group bg-card"
                        onClick={() => navigate(`/players/${track.id}`)} 
                      >
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

                          {/* Rodapé */}
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
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className={cn(
                      "flex flex-col items-center justify-center py-10 px-2 text-center transition-opacity",
                      isDragOver ? "opacity-0" : "opacity-50" // Esconde o texto "vazio" se estiver arrastando algo em cima
                    )}>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Arraste aqui</p>
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