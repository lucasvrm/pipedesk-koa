import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MasterDeal, PlayerTrack, STATUS_LABELS, OPERATION_LABELS } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Plus, Users } from '@phosphor-icons/react'
import PlayerTracksList from './PlayerTracksList'
import CreatePlayerDialog from './CreatePlayerDialog'

interface DealDetailDialogProps {
  deal: MasterDeal
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DealDetailDialog({ deal, open, onOpenChange }: DealDetailDialogProps) {
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false)

  const dealTracks = (playerTracks || []).filter(t => t.masterDealId === deal.id)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{deal.clientName}</DialogTitle>
                <DialogDescription className="space-y-1">
                  <div className="flex items-center gap-3 text-sm">
                    <Badge
                      className={
                        deal.status === 'active' ? 'status-active' :
                        deal.status === 'cancelled' ? 'status-cancelled' :
                        'status-concluded'
                      }
                    >
                      {STATUS_LABELS[deal.status]}
                    </Badge>
                    <span>{OPERATION_LABELS[deal.operationType]}</span>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Volume Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold break-words">{formatCurrency(deal.volume)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Prazo Final
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{formatDate(deal.deadline)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Players Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{dealTracks.filter(t => t.status === 'active').length}</p>
              </CardContent>
            </Card>
          </div>

          {deal.observations && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm text-muted-foreground">{deal.observations}</p>
            </div>
          )}

          <Separator className="my-4" />

          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="players">
                <Users className="mr-2" />
                Players ({dealTracks.length})
              </TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Players em Negociação</h3>
                <Button size="sm" onClick={() => setCreatePlayerOpen(true)}>
                  <Plus className="mr-2" />
                  Adicionar Player
                </Button>
              </div>

              {dealTracks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Nenhum player adicionado ainda</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setCreatePlayerOpen(true)}
                  >
                    Adicionar Primeiro Player
                  </Button>
                </div>
              ) : (
                <PlayerTracksList tracks={dealTracks} />
              )}
            </TabsContent>

            <TabsContent value="activity">
              <div className="text-center py-12 text-muted-foreground">
                <p>Histórico de atividades em breve</p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreatePlayerDialog
        masterDeal={deal}
        open={createPlayerOpen}
        onOpenChange={setCreatePlayerOpen}
      />
    </>
  )
}
