import { useState } from 'react'
import { useDeals } from '@/services/dealService'
import { useTracks } from '@/services/trackService'
import { useStages } from '@/services/pipelineService' // Hook Dinâmico
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/EmptyState'
import { User, PipelineStage } from '@/lib/types'
import { formatCurrency, anonymizePlayerName, calculateFee } from '@/lib/helpers'
import { canViewPlayerName } from '@/lib/permissions'
import { CaretLeft, CaretRight, Kanban } from '@phosphor-icons/react'
import PlayerTrackDetailDialog from './PlayerTrackDetailDialog'
import { CreateDealDialog } from './CreateDealDialog'

interface MasterMatrixViewProps {
  currentUser: User
}

export default function MasterMatrixView({ currentUser }: MasterMatrixViewProps) {
  const { data: masterDeals } = useDeals()
  const { data: playerTracks } = useTracks()
  const { data: stages = [] } = useStages()

  const [selectedDealIndex, setSelectedDealIndex] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [createDealOpen, setCreateDealOpen] = useState(false)

  const canSeePlayerNames = canViewPlayerName(currentUser.role)
  const activeDeals = (masterDeals || [])
    .filter(d => d.status === 'active' && !d.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Helper para normalizar o estágio
  const getStageInfo = (trackStage: string) => {
    return stages.find(s => s.id === trackStage) || 
           stages.find(s => s.name.toLowerCase().replace(/\s/g, '_') === trackStage) ||
           stages.find(s => s.isDefault);
  }

  const getTracksForDealAndStage = (dealId: string, stage: PipelineStage) => {
    return (playerTracks || []).filter(t => {
      const isMatch = t.masterDealId === dealId && t.status === 'active';
      if (!isMatch) return false;
      
      const trackStageInfo = getStageInfo(t.currentStage);
      // Se não encontrar info do estágio, assume que não pertence a esta coluna
      if (!trackStageInfo) return false;
      
      return trackStageInfo.id === stage.id;
    })
  }

  const handleCellClick = (tracks: any[]) => {
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

  const currentDeal = activeDeals.length > 0 ? activeDeals[selectedDealIndex] : null

  if (stages.length === 0 && activeDeals.length > 0) {
    return <div className="p-8 text-center text-muted-foreground">Carregando pipeline...</div>
  }

  return (
    <>
      {activeDeals.length === 0 ? (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Kanban</h2>
            <p className="text-muted-foreground">
              Visualização de deals e players por estágio
            </p>
          </div>
          <EmptyState
            icon={<Kanban size={64} weight="duotone" />}
            title="Nenhum negócio ativo no Kanban"
            description="Comece criando um Master Deal para visualizar e gerenciar seus players em cada estágio do pipeline."
            actionLabel="Criar Negócio"
            onAction={() => setCreateDealOpen(true)}
          />
        </div>
      ) : currentDeal ? (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Kanban</h2>
              <p className="text-muted-foreground">Visualização de deals e players por estágio</p>
            </div>
          </div>

          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{currentDeal.clientName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevDeal} disabled={selectedDealIndex === 0}><CaretLeft /></Button>
                    <span className="text-sm text-muted-foreground px-2">{selectedDealIndex + 1} / {activeDeals.length}</span>
                    <Button variant="outline" size="sm" onClick={handleNextDeal} disabled={selectedDealIndex === activeDeals.length - 1}><CaretRight /></Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{formatCurrency(currentDeal.volume)}</div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-sm bg-muted/50">Players</th>
                        {stages.map(stage => (
                          <th key={stage.id} className="p-3 text-center font-semibold text-sm bg-muted/50 border-l" style={{ borderTop: `3px solid ${stage.color}` }}>
                            <div>{stage.name}</div>
                            <div className="text-xs text-muted-foreground font-normal mt-1">{stage.probability}%</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 font-medium text-sm border-r bg-muted/30"></td>
                        {stages.map(stage => {
                          const tracks = getTracksForDealAndStage(currentDeal.id, stage)
                          return (
                            <td key={stage.id} className="p-3 border-r border-b align-top cursor-pointer hover:bg-muted/50 transition-colors h-[200px]" onClick={() => handleCellClick(tracks)}>
                              {tracks.length === 0 ? (
                                <div className="text-center text-muted-foreground text-sm py-4 opacity-30">—</div>
                              ) : (
                                <div className="space-y-2">
                                  {tracks.map((track) => {
                                    const playerName = canSeePlayerNames ? track.playerName : anonymizePlayerName(track.playerName, track.id, true)
                                    const feeValue = calculateFee(track.trackVolume, currentDeal.feePercentage || 0)
                                    return (
                                      <Card key={track.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-3">
                                          <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="font-medium text-sm truncate">{playerName}</span>
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1">{track.probability || stage.probability}%</Badge>
                                          </div>
                                          <div className="text-xs text-muted-foreground">{formatCurrency(track.trackVolume)}</div>
                                          <div className="text-[10px] text-emerald-600 font-medium mt-1">Fee: {formatCurrency(feeValue)}</div>
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
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden space-y-4">
            <div className="flex items-center justify-between px-4">
              <Button variant="outline" size="sm" onClick={handlePrevDeal} disabled={selectedDealIndex === 0}><CaretLeft className="mr-1" /> Anterior</Button>
              <span className="text-sm font-medium">{selectedDealIndex + 1} / {activeDeals.length}</span>
              <Button variant="outline" size="sm" onClick={handleNextDeal} disabled={selectedDealIndex === activeDeals.length - 1}>Próximo <CaretRight className="ml-1" /></Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentDeal.clientName}</CardTitle>
                <p className="text-sm text-muted-foreground">{formatCurrency(currentDeal.volume)}</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4">
                    {stages.map(stage => {
                      const tracks = getTracksForDealAndStage(currentDeal.id, stage)
                      return (
                        <div key={stage.id} className="min-w-[200px]">
                          <div className="font-semibold text-sm mb-2 sticky top-0 bg-background py-2 border-b" style={{ borderBottomColor: stage.color }}>
                            {stage.name}
                            <span className="text-xs text-muted-foreground ml-2">({stage.probability}%)</span>
                          </div>
                          <div className="space-y-2">
                            {tracks.length === 0 ? (
                              <div className="text-center text-muted-foreground text-sm py-4">Nenhum</div>
                            ) : (
                              tracks.map(track => {
                                const playerName = canSeePlayerNames ? track.playerName : anonymizePlayerName(track.playerName, track.id, true)
                                return (
                                  <Card key={track.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedTrack(track); setDetailDialogOpen(true); }}>
                                    <CardContent className="p-3">
                                      <p className="font-medium text-sm mb-1">{playerName}</p>
                                      <p className="text-xs text-muted-foreground">{formatCurrency(track.trackVolume)}</p>
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
      ) : null}
      <CreateDealDialog open={createDealOpen} onOpenChange={setCreateDealOpen} />
    </>
  )
}