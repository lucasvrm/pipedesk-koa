import { useState } from 'react'
import { PlayerTrack, User } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SLAStatusBadge } from '@/components/SLAIndicator'
import { formatCurrency, calculateWeightedVolume } from '@/lib/helpers'
import { canViewPlayerName } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import PlayerTrackDetailDialog from './PlayerTrackDetailDialog'
import { useStages } from '@/services/pipelineService'
import { useNavigate } from 'react-router-dom'
import { useUpdateTrack, useDeleteTrack } from '@/services/trackService'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getTrackQuickActions } from '@/hooks/useQuickActions'
import { useAuth } from '@/contexts/AuthContext'

interface PlayerTracksListProps {
  tracks: PlayerTrack[]
  currentUser?: User
}

export default function PlayerTracksList({ tracks, currentUser }: PlayerTracksListProps) {
  const [selectedTrack, setSelectedTrack] = useState<PlayerTrack | null>(null)
  const { data: stages = [] } = useStages()
  const navigate = useNavigate()
  const updateTrack = useUpdateTrack()
  const deleteTrack = useDeleteTrack()
  const { profile } = useAuth()

  const canViewRealNames = currentUser ? canViewPlayerName(currentUser.role) : true

  const getDisplayName = (track: PlayerTrack, index: number) => {
    if (canViewRealNames) {
      return track.playerName
    }
    return `Player ${String.fromCharCode(65 + index)}`
  }

  // Helper para dados do estágio
  const getStageInfo = (stageId: string) => {
    return stages.find(s => s.id === stageId) || { name: stageId, probability: 0, color: '#94a3b8' }
  }

  return (
    <>
      <div className="space-y-3">
        {tracks.map((track, index) => {
          const stageInfo = getStageInfo(track.currentStage)
          const probability = track.probability || stageInfo.probability || 0
          const weighted = calculateWeightedVolume(track.trackVolume, probability)
          const displayName = getDisplayName(track, index)

          return (
            <div
              key={track.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedTrack(track)}
            >
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-1 truncate">{displayName}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    <span className="break-words">{formatCurrency(track.trackVolume)}</span>
                    <span>•</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        track.status === 'active' && 'status-active',
                        track.status === 'cancelled' && 'status-cancelled',
                        track.status === 'concluded' && 'status-concluded'
                      )}
                      style={track.status === 'active' ? { backgroundColor: `${stageInfo.color}20`, color: stageInfo.color } : {}}
                    >
                      {stageInfo.name}
                    </Badge>
                    {track.status === 'active' && (
                      <SLAStatusBadge 
                        playerTrackId={track.id} 
                        currentStage={track.currentStage} 
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-medium whitespace-nowrap">{probability}% prob.</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatCurrency(weighted)} ponderado
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <QuickActionsMenu
                      actions={getTrackQuickActions({
                        track,
                        navigate,
                        updateTrack,
                        deleteTrack,
                        profileId: profile?.id,
                        onEdit: () => setSelectedTrack(track),
                      })}
                    />
                  </div>
                </div>
              </div>

              <Progress value={probability} className="h-2" />

              {track.notes && (
                <p className="text-sm text-muted-foreground mt-3 break-words">{track.notes}</p>
              )}
            </div>
          )
        })}
      </div>

      {selectedTrack && (
        <PlayerTrackDetailDialog
          track={selectedTrack}
          open={!!selectedTrack}
          onOpenChange={(open) => !open && setSelectedTrack(null)}
          currentUser={currentUser}
        />
      )}
    </>
  )
}