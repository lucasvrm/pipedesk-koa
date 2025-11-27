import { useState } from 'react'
import { PlayerTrack } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { ArrowUUpLeft, Trash } from '@phosphor-icons/react'
import { useUpdateTrack, useDeleteTrack } from '@/services/trackService'
import { toast } from 'sonner'

interface DroppedPlayersListProps {
  tracks: PlayerTrack[]
}

export function DroppedPlayersList({ tracks }: DroppedPlayersListProps) {
  const updateTrack = useUpdateTrack()
  const deleteTrack = useDeleteTrack()
  
  // Estado para controlar qual track está sendo excluído
  const [trackToDelete, setTrackToDelete] = useState<PlayerTrack | null>(null)

  const handleReactivate = (trackId: string) => {
    updateTrack.mutate({
      trackId,
      updates: { status: 'active', currentStage: 'nda' } // Volta para NDA por padrão
    }, {
      onSuccess: () => toast.success('Player reativado com sucesso!'),
      onError: () => toast.error('Erro ao reativar player')
    })
  }

  // Executa a exclusão após confirmação no Modal
  const confirmDelete = () => {
    if (!trackToDelete) return

    deleteTrack.mutate(trackToDelete.id, {
      onSuccess: () => {
        toast.success('Player excluído definitivamente.')
        setTrackToDelete(null)
      },
      onError: () => toast.error('Erro ao excluir player')
    })
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
        <Trash className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Sem Dropps até o momento.</p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Fase Anterior</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Data Cancelamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell className="font-medium">{track.playerName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {track.currentStage}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(track.trackVolume)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(track.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleReactivate(track.id)}
                      title="Reativar Player"
                    >
                      <ArrowUUpLeft className="mr-2 h-4 w-4" />
                      Reativar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setTrackToDelete(track)}
                      title="Excluir Definitivamente"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!trackToDelete} onOpenChange={() => setTrackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro do player 
              <strong> {trackToDelete?.playerName}</strong> deste deal, incluindo todo o histórico e tarefas vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}