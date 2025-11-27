import { useMemo, useState } from 'react'
import { PlayerTrack, PlayerStage, STAGE_LABELS } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom' // Usando Link para navegação nativa
import { cn } from '@/lib/utils'
import { CalendarBlank, Wallet, User, XCircle, Warning } from '@phosphor-icons/react'
import { useUpdateTrack } from '@/services/trackService'
import { logActivity } from '@/services/activityService'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DealPlayersKanbanProps {
  tracks: PlayerTrack[]
  currentUser?: any
}

const KANBAN_STAGES: PlayerStage[] = ['nda', 'analysis', 'proposal', 'negotiation', 'closing']

export default function DealPlayersKanban({ tracks, currentUser: propsUser }: DealPlayersKanbanProps) {
  const updateTrack = useUpdateTrack()
  const { profile: currentUser } = useAuth()
  
  const [draggedTrack, setDraggedTrack] = useState<PlayerTrack | null>(null)
  const [dragOverStage, setDragOverStage] = useState<PlayerStage | null>(null)
  
  const [trackToCancel, setTrackToCancel] = useState<PlayerTrack | null>(null)

  const columns = useMemo(() => {
    const cols: Record<PlayerStage, PlayerTrack[]> = {
      nda: [], analysis: [], proposal: [], negotiation: [], closing: []
    }
    tracks.forEach(track => {
      if (track.status !== 'cancelled' && cols[track.currentStage]) {
        cols[track.currentStage].push(track)
      }
    })
    return cols
  }, [tracks])

  const confirmCancel = () => {
    if (!trackToCancel) return

    updateTrack.mutate({
      trackId: trackToCancel.id,
      updates: { status: 'cancelled' }
    }, {
      onSuccess: () => {
        toast.success('Player cancelado com sucesso')
        if (currentUser) {
          logActivity(
            trackToCancel.masterDealId,
            'track',
            `Player ${trackToCancel.playerName} foi movido para Dropped (Cancelado)`,
            currentUser.id
          )
        }
        setTrackToCancel(null)
      },
      onError: () => toast.error('Erro ao cancelar player')
    })
  }

  const handleDragStart = (track: PlayerTrack) => setDraggedTrack(track)
  
  const handleDragOver = (e: React.DragEvent, stage: PlayerStage) => {
    e.preventDefault()
    if (dragOverStage !== stage) setDragOverStage(stage)
  }

  const handleDragLeave = () => setDragOverStage(null)

  const handleDrop = (targetStage: PlayerStage) => {
    setDragOverStage(null)
    if (!draggedTrack || draggedTrack.currentStage === targetStage) return

    const oldStageLabel = STAGE_LABELS[draggedTrack.currentStage]
    const newStageLabel = STAGE_LABELS[targetStage]

    updateTrack.mutate({
      trackId: draggedTrack.id,
      updates: { currentStage: targetStage }
    }, {
      onSuccess: () => {
        toast.success(`Movido para ${newStageLabel}`)
        if (currentUser) {
          logActivity(
            draggedTrack.masterDealId,
            'track',
            `Moveu ${draggedTrack.playerName} de ${oldStageLabel} para ${newStageLabel}`,
            currentUser.id,
            { from: draggedTrack.currentStage, to: targetStage }
          )
        }
      },
      onError: () => toast.error("Erro ao mover o player")
    })
    setDraggedTrack(null)
  }

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
    <>
      <div className="h-[600px] w-full pb-4">
        <div className="flex h-full w-full gap-2">
          {KANBAN_STAGES.map((stage) => {
            const items = columns[stage] || []
            const totalVolume = items.reduce((acc, item) => acc + (item.trackVolume || 0), 0)
            const isDragOver = dragOverStage === stage
            
            return (
              <div 
                key={stage} 
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(stage)}
                className={cn(
                  "flex flex-col flex-1 min-w-0 rounded-lg border transition-colors duration-200",
                  isDragOver ? "bg-primary/10 border-primary border-dashed" : "bg-muted/30 border-border/50"
                )}
              >
                {/* Header */}
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

                {/* Cards */}
                <ScrollArea className="flex-1 p-1 md:p-2">
                  <div className="space-y-2">
                    {items.map((track) => {
                      // VERIFICAÇÃO DE SEGURANÇA DO ID
                      const hasValidId = track.id && track.id.length > 0;
                      
                      const CardContentWrapper = (
                        <Card 
                          className={cn(
                            "cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary bg-card group/card-content",
                            !hasValidId && "border-destructive/50 bg-destructive/5 cursor-not-allowed"
                          )}
                        >
                          <CardContent className="p-2 md:p-3 space-y-2 relative">
                            {/* Aviso de erro se sem ID */}
                            {!hasValidId && (
                              <div className="flex items-center gap-1 text-destructive text-[10px] mb-1">
                                <Warning weight="fill" /> Erro: ID inválido
                              </div>
                            )}

                            {/* Botão Cancelar */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover/card-content:opacity-100 transition-opacity z-20">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTrackToCancel(track)
                                }}
                                title="Cancelar Track"
                              >
                                <XCircle weight="fill" />
                              </Button>
                            </div>

                            <div className="flex justify-between items-start gap-2 pr-6">
                              <h5 className="text-xs md:text-sm font-semibold leading-tight line-clamp-2 group-hover/card-content:text-primary transition-colors break-words">
                                {track.playerName}
                              </h5>
                            </div>

                            <div className="grid grid-cols-1 gap-1">
                              <div className="flex items-center text-[10px] md:text-xs text-muted-foreground gap-1.5 overflow-hidden">
                                <Wallet className="h-3 w-3 shrink-0 text-primary/70" />
                                <span className="font-medium text-foreground truncate">{formatCurrency(track.trackVolume)}</span>
                              </div>
                              <div className="flex items-center text-[10px] md:text-xs text-muted-foreground gap-1.5 overflow-hidden">
                                <CalendarBlank className="h-3 w-3 shrink-0" />
                                <span className="truncate">{formatDate(track.updatedAt)}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t flex justify-between items-center gap-1">
                              <Badge variant="outline" className="text-[9px] h-4 px-1 border-dashed shrink-0">
                                {track.probability}%
                              </Badge>
                              {track.responsibles?.length > 0 && (
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  <Avatar className="h-5 w-5 border border-background ring-1 ring-background shrink-0">
                                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary"><User size={10} /></AvatarFallback>
                                  </Avatar>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );

                      return (
                        <div
                          key={track.id || Math.random()} // Fallback key
                          draggable={hasValidId} // Só permite arrastar se tiver ID
                          onDragStart={() => hasValidId && handleDragStart(track)}
                          className={cn(
                            "transition-opacity relative group/card",
                            draggedTrack?.id === track.id ? "opacity-50" : "opacity-100"
                          )}
                        >
                          {/* Só envolve com Link se tiver ID válido */}
                          {hasValidId ? (
                            <Link to={`/tracks/${track.id}`} className="block">
                              {CardContentWrapper}
                            </Link>
                          ) : (
                            CardContentWrapper
                          )}
                        </div>
                      )
                    })}
                    
                    {items.length === 0 && (
                      <div className={cn("flex flex-col items-center justify-center py-10 px-2 text-center transition-opacity", isDragOver ? "opacity-0" : "opacity-50")}>
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2"><div className="h-1 w-1 rounded-full bg-muted-foreground/50" /></div>
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

      <AlertDialog open={!!trackToCancel} onOpenChange={() => setTrackToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Player?</AlertDialogTitle>
            <AlertDialogDescription>
              Este player será movido para a lista de "Dropped". Você pode reativá-lo depois se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}