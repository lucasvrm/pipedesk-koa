import { useMemo, useState } from 'react'
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, DragEndEvent, closestCorners } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PlayerTrack } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { useStages } from '@/services/pipelineService'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarBlank, Wallet, User, XCircle } from '@phosphor-icons/react'
import { useUpdateTrack } from '@/services/trackService'
import { logActivity } from '@/services/activityService'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface DealPlayersKanbanProps {
  tracks: PlayerTrack[]
  currentUser?: any
}

export default function DealPlayersKanban({ tracks, currentUser: _propsUser }: DealPlayersKanbanProps) {
  const updateTrack = useUpdateTrack()
  const { profile: currentUser } = useAuth()
  const { data: stages = [] } = useStages()

  const [trackToCancel, setTrackToCancel] = useState<PlayerTrack | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const getStageId = (trackStage: string) => {
    if (!trackStage) return 'unknown'
    const stage = stages.find(s => s.id === trackStage) ||
                  stages.find(s => s.name.toLowerCase().replace(/\s/g, '_') === trackStage)
    return stage ? stage.id : (stages.find(s => s.isDefault)?.id || 'unknown')
  }

  const columns = useMemo(() => {
    const cols: Record<string, PlayerTrack[]> = {}
    stages.forEach(s => cols[s.id] = [])
    tracks.forEach(track => {
      if (track.status !== 'cancelled') {
        const stageId = getStageId(track.currentStage)
        if (cols[stageId]) cols[stageId].push(track)
        else {
          const first = stages[0]?.id
          if (first) cols[first].push(track)
        }
      }
    })
    return cols
  }, [tracks, stages])

  const confirmCancel = () => {
    if (!trackToCancel) return
    updateTrack.mutate({
      trackId: trackToCancel.id,
      updates: { status: 'cancelled' }
    }, {
      onSuccess: () => {
        toast.success('Player cancelado')
        if (currentUser) logActivity(trackToCancel.masterDealId, 'track', `Cancelado: ${trackToCancel.playerName}`, currentUser.id)
        setTrackToCancel(null)
      },
      onError: () => toast.error('Erro ao cancelar')
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const sourceStageId = active.data.current?.stageId as string | undefined
    const targetStageId = over.data.current?.stageId as string | undefined
    if (!sourceStageId || !targetStageId || sourceStageId === targetStageId) return

    const draggedTrack = tracks.find(track => track.id === active.id)
    if (!draggedTrack) return

    const targetStageName = stages.find(s => s.id === targetStageId)?.name || 'Nova Fase'

    updateTrack.mutate({ trackId: draggedTrack.id, updates: { currentStage: targetStageId } }, {
      onSuccess: () => {
        toast.success(`Movido para ${targetStageName}`)
        if (currentUser) logActivity(draggedTrack.masterDealId, 'track', `Movido para ${targetStageName}`, currentUser.id)
      },
    })
  }

  if (stages.length === 0) return <div className="p-8 text-center">Carregando pipeline...</div>

  return (
    <>
      <div className="h-[600px] w-full pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex h-full w-full gap-2 overflow-x-auto pb-2">
            {stages.map((stage) => {
              const items = columns[stage.id] || []
              const totalVolume = items.reduce((acc, item) => acc + (item.trackVolume || 0), 0)
              return (
                <SortableContext key={stage.id} items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  <DroppableColumn stageId={stage.id} name={stage.name} color={stage.color} count={items.length} totalVolume={totalVolume}>
                    {items.map((track) => (
                      <TrackCard key={track.id} track={track} stageId={stage.id} stageProbability={stage.probability} onCancel={() => setTrackToCancel(track)} />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              )
            })}
          </div>
        </DndContext>
      </div>
      <AlertDialog open={!!trackToCancel} onOpenChange={() => setTrackToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancelar Player?</AlertDialogTitle><AlertDialogDescription>Mover para Dropped.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel><AlertDialogAction onClick={confirmCancel}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function DroppableColumn({
  stageId,
  name,
  color,
  count,
  totalVolume,
  children,
}: {
  stageId: string
  name: string
  color: string
  count: number
  totalVolume: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stageId,
    data: { stageId },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 min-w-[260px] rounded-lg border transition-colors duration-200",
        isOver ? "bg-primary/10 border-primary border-dashed" : "bg-muted/30 border-border/50"
      )}
    >
      <div className="p-3 border-b bg-card rounded-t-lg border-t-4 shadow-sm select-none" style={{ borderTopColor: color }}>
        <div className="flex justify-between mb-1 gap-1">
          <h4 className="font-semibold text-sm truncate">{name}</h4>
          <Badge variant="secondary" className="text-[10px] h-5">{count}</Badge>
        </div>
        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Wallet className="h-3 w-3" /> {formatCurrency(totalVolume)}
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}

function TrackCard({
  track,
  stageId,
  stageProbability,
  onCancel,
}: {
  track: PlayerTrack
  stageId: string
  stageProbability?: number
  onCancel: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    data: { stageId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn("transition-opacity", isDragging ? "opacity-60" : "opacity-100")}>
      <Card className="cursor-grab hover:shadow-md border-l-4 hover:border-l-primary group">
        <CardContent className="p-3 space-y-2 relative">
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={(e) => { e.preventDefault(); onCancel() }}><XCircle /></Button>
          </div>
          <h5 className="text-sm font-semibold truncate pr-6">{track.playerName}</h5>
          <div className="text-xs text-muted-foreground flex justify-between">
            <span className="flex items-center gap-1"><Wallet size={12}/> {formatCurrency(track.trackVolume)}</span>
            <span className="flex items-center gap-1"><CalendarBlank size={12}/> {formatDate(track.updatedAt)}</span>
          </div>
          <div className="pt-2 border-t flex justify-between items-center">
            <Badge variant="outline" className="text-[9px] h-4">{track.probability || stageProbability}%</Badge>
            {track.responsibles?.length > 0 && <Avatar className="h-5 w-5"><AvatarFallback className="text-[8px]"><User /></AvatarFallback></Avatar>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
