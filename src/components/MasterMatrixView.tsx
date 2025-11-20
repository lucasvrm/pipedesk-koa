import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MasterDeal, PlayerTrack, User, STAGE_LABELS, STAGE_PROBABILITIES } from '@/lib/types'
import { formatCurrency, anonymizePlayerName, calculateWeightedVolume, calculateFee } from '@/lib/helpers'
import { canViewPlayerName } from '@/features/rbac'
import { CaretLeft, CaretRight, Eye } from '@phosphor-icons/react'
import PlayerTrackDetailDialog from './PlayerTrackDetailDialog'

interface MasterMatrixViewProps {
  currentUser: User
}

export default function MasterMatrixView({ currentUser }: MasterMatrixViewProps) {
  const [masterDeals] = useKV<MasterDeal[]>('masterDeals', [])
  const [playerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [selectedDealIndex, setSelectedDealIndex] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState<PlayerTrack | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const canSeePlayerNames = canViewPlayerName(currentUser.role)
  const activeDeals = (masterDeals || [])
    .filter(d => d.status === 'active' && !d.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const stages = ['nda', 'analysis', 'proposal', 'negotiation', 'closing'] as const

  const getTracksForDealAndStage = (dealId: string, stage: string) => {
    return (playerTracks || []).filter(
      t => t.masterDealId === dealId && t.currentStage === stage && t.status === 'active'
    )
  }

  const handleCellClick = (tracks: PlayerTrack[]) => {
    if (tracks.length === 1) {
      setSelectedTrack(tracks[0])
      setDetailDialogOpen(true)
    }
  }

  const handlePrevDeal = () => {
    setSelectedDealIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextDeal = () => {
    setSelectedDealIndex(prev => Math.min(activeDeals.length - 1, prev + 1))
  }

  if (activeDeals.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum negócio ativo para exibir na matriz</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentDeal = activeDeals[selectedDealIndex]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Kanban</h2>
          <p className="text-muted-foreground">
            Visualização de deals e players por estágio
          </p>
        </div>
      </div>

      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {currentDeal.clientName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevDeal}
                  disabled={selectedDealIndex === 0}
                >
                  <CaretLeft />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {selectedDealIndex + 1} / {activeDeals.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDeal}
                  disabled={selectedDealIndex === activeDeals.length - 1}
                >
                  <CaretRight />
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(currentDeal.volume)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm bg-muted/50">
                      Estágio
                    </th>
                    {stages.map(stage => (
                      <th key={stage} className="p-3 text-center font-semibold text-sm bg-muted/50">
                        <div>{STAGE_LABELS[stage]}</div>
                        <div className="text-xs text-muted-foreground font-normal mt-1">
                          {STAGE_PROBABILITIES[stage]}%
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-medium text-sm border-r bg-muted/30">
                      Players
                    </td>
                    {stages.map(stage => {
                      const tracks = getTracksForDealAndStage(currentDeal.id, stage)
                      return (
                        <td
                          key={stage}
                          className="p-3 border-r border-b align-top cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleCellClick(tracks)}
                        >
                          {tracks.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-4">
                              —
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {tracks.map((track, idx) => {
                                const playerName = canSeePlayerNames
                                  ? track.playerName
                                  : anonymizePlayerName(track.playerName, track.id, true)
                                const weightedValue = calculateWeightedVolume(
                                  track.trackVolume,
                                  track.probability
                                )
                                const feeValue = calculateFee(
                                  track.trackVolume,
                                  currentDeal.feePercentage || 0
                                )

                                return (
                                  <Card key={track.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-3">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="font-medium text-sm truncate">
                                          {playerName}
                                        </span>
                                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                                          {track.probability}%
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatCurrency(track.trackVolume)}
                                      </div>
                                      <div className="text-xs text-accent font-medium mt-1">
                                        Fee: {formatCurrency(feeValue)}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Players: </span>
                  <span className="font-semibold">
                    {(playerTracks || []).filter(t => t.masterDealId === currentDeal.id && t.status === 'active').length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pipeline Ponderado: </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      (playerTracks || [])
                        .filter(t => t.masterDealId === currentDeal.id && t.status === 'active')
                        .reduce((sum, t) => sum + calculateWeightedVolume(t.trackVolume, t.probability), 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Prob. Média: </span>
                  <span className="font-semibold">
                    {(() => {
                      const activeTracks = (playerTracks || []).filter(
                        t => t.masterDealId === currentDeal.id && t.status === 'active'
                      )
                      const avgProb = activeTracks.length > 0
                        ? activeTracks.reduce((sum, t) => sum + t.probability, 0) / activeTracks.length
                        : 0
                      return `${avgProb.toFixed(0)}%`
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDeal}
            disabled={selectedDealIndex === 0}
          >
            <CaretLeft className="mr-1" />
            Anterior
          </Button>
          <span className="text-sm font-medium">
            {selectedDealIndex + 1} / {activeDeals.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDeal}
            disabled={selectedDealIndex === activeDeals.length - 1}
          >
            Próximo
            <CaretRight className="ml-1" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentDeal.clientName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(currentDeal.volume)}
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {stages.map(stage => {
                  const tracks = getTracksForDealAndStage(currentDeal.id, stage)
                  return (
                    <div key={stage} className="min-w-[200px]">
                      <div className="font-semibold text-sm mb-2 sticky top-0 bg-background py-2">
                        {STAGE_LABELS[stage]}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({STAGE_PROBABILITIES[stage]}%)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {tracks.length === 0 ? (
                          <div className="text-center text-muted-foreground text-sm py-4">
                            Nenhum player
                          </div>
                        ) : (
                          tracks.map(track => {
                            const playerName = canSeePlayerNames
                              ? track.playerName
                              : anonymizePlayerName(track.playerName, track.id, true)

                            return (
                              <Card
                                key={track.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  setSelectedTrack(track)
                                  setDetailDialogOpen(true)
                                }}
                              >
                                <CardContent className="p-3">
                                  <p className="font-medium text-sm mb-1">{playerName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(track.trackVolume)}
                                  </p>
                                  <Badge variant="secondary" className="text-xs mt-2">
                                    {track.probability}%
                                  </Badge>
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {selectedTrack && (
        <PlayerTrackDetailDialog
          track={selectedTrack}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      )}
    </div>
  )
}
