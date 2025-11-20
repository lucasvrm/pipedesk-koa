import { PlayerTrack, STAGE_LABELS, STAGE_PROBABILITIES } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, calculateWeightedVolume } from '@/lib/helpers'
import { cn } from '@/lib/utils'

interface PlayerTracksListProps {
  tracks: PlayerTrack[]
}

export default function PlayerTracksList({ tracks }: PlayerTracksListProps) {
  return (
    <div className="space-y-3">
      {tracks.map((track) => {
        const probability = STAGE_PROBABILITIES[track.currentStage]
        const weighted = calculateWeightedVolume(track.trackVolume, probability)

        return (
          <div
            key={track.id}
            className="p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3 gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold mb-1 truncate">{track.playerName}</h4>
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
                  >
                    {STAGE_LABELS[track.currentStage]}
                  </Badge>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-medium whitespace-nowrap">{probability}% prob.</div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatCurrency(weighted)} ponderado
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
  )
}
