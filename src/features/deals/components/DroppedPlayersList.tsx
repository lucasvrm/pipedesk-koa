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
import { ArrowUUpLeft, Trash } from '@phosphor-icons/react'
import { useUpdateTrack } from '@/services/trackService'
import { toast } from 'sonner'

interface DroppedPlayersListProps {
  tracks: PlayerTrack[]
}

export function DroppedPlayersList({ tracks }: DroppedPlayersListProps) {
  const updateTrack = useUpdateTrack()

  const handleReactivate = (trackId: string) => {
    updateTrack.mutate({
      trackId,
      updates: { status: 'active', currentStage: 'nda' } // Volta para NDA por padrão
    }, {
      onSuccess: () => toast.success('Player reativado com sucesso!'),
      onError: () => toast.error('Erro ao reativar player')
    })
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
        <Trash className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        {/* MUDANÇA AQUI: Texto atualizado */}
        <p className="text-sm text-muted-foreground">Sem Dropps até o momento.</p>
      </div>
    )
  }

  return (
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleReactivate(track.id)}
                  title="Reativar Player"
                >
                  <ArrowUUpLeft className="mr-2 h-4 w-4" />
                  Reativar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}