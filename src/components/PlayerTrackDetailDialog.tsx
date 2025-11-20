import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlayerTrack, STAGE_LABELS, STAGE_PROBABILITIES, PlayerStage, DealStatus, STATUS_LABELS, ViewType, User, MasterDeal } from '@/lib/types'
import { formatCurrency, calculateWeightedVolume, trackStageChange } from '@/lib/helpers'
import { ListChecks, Kanban as KanbanIcon, ChartLine, CalendarBlank, ChatCircle, Sparkle, FileText, ClockCounterClockwise, Tag } from '@phosphor-icons/react'
import { TaskList } from '@/features/tasks'
import PlayerKanban from './PlayerKanban'
import PlayerGantt from './PlayerGantt'
import PlayerCalendar from './PlayerCalendar'
import CommentsPanel from './CommentsPanel'
import AINextSteps from './AINextSteps'
import DocumentManager from './DocumentManager'
import ActivityHistory from './ActivityHistory'
import CustomFieldsRenderer from './CustomFieldsRenderer'
import PhaseValidationDialog from './PhaseValidationDialog'
import { validatePhaseTransition, PhaseTransitionRule, ValidationResult } from '@/lib/phaseValidation'
import { toast } from 'sonner'

interface PlayerTrackDetailDialogProps {
  track: PlayerTrack
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser?: User
}

export default function PlayerTrackDetailDialog({ track, open, onOpenChange, currentUser }: PlayerTrackDetailDialogProps) {
  const [playerTracks, setPlayerTracks] = useKV<PlayerTrack[]>('playerTracks', [])
  const [trackViewPreferences, setTrackViewPreferences] = useKV<Record<string, ViewType>>('trackViewPreferences', {})
  const [deals] = useKV<MasterDeal[]>('deals', [])
  const [phaseRules] = useKV<PhaseTransitionRule[]>('phaseTransitionRules', [])
  
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [pendingStageChange, setPendingStageChange] = useState<PlayerStage | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  
  const currentView = (trackViewPreferences || {})[track.id] || 'list'

  const setCurrentView = (view: ViewType) => {
    setTrackViewPreferences((prefs) => ({
      ...(prefs || {}),
      [track.id]: view,
    }))
  }

  useEffect(() => {
    if (open && !trackViewPreferences?.[track.id]) {
      setCurrentView('list')
    }
  }, [open, track.id])

  const probability = STAGE_PROBABILITIES[track.currentStage]
  const weighted = calculateWeightedVolume(track.trackVolume, probability)
  const masterDeal = (deals || []).find(d => d.id === track.masterDealId)

  const performStageChange = (newStage: PlayerStage) => {
    const oldStage = track.currentStage
    
    trackStageChange(track.id, newStage, oldStage)
    
    setPlayerTracks((currentTracks) =>
      (currentTracks || []).map(t =>
        t.id === track.id
          ? {
              ...t,
              currentStage: newStage,
              probability: STAGE_PROBABILITIES[newStage],
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )
    toast.success(`Estágio atualizado para ${STAGE_LABELS[newStage]}`)
  }

  const handleStageChange = (newStage: PlayerStage) => {
    if (newStage === track.currentStage) return

    const validation = validatePhaseTransition(track, masterDeal, newStage, phaseRules || [])
    
    setValidationResult(validation)
    setPendingStageChange(newStage)
    setValidationDialogOpen(true)
  }

  const handleValidationConfirm = () => {
    if (pendingStageChange && validationResult?.isValid) {
      performStageChange(pendingStageChange)
      setPendingStageChange(null)
      setValidationResult(null)
    }
  }

  const handleStatusChange = (newStatus: DealStatus) => {
    if (newStatus === 'concluded') {
      const siblingTracks = (playerTracks || []).filter(
        t => t.masterDealId === track.masterDealId && t.id !== track.id && t.status === 'active'
      )

      setPlayerTracks((currentTracks) =>
        (currentTracks || []).map(t => {
          if (t.id === track.id) {
            return { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          }
          if (siblingTracks.some(st => st.id === t.id)) {
            return { ...t, status: 'cancelled', updatedAt: new Date().toISOString() }
          }
          return t
        })
      )

      toast.success(`Player concluído! ${siblingTracks.length} players concorrentes foram cancelados.`)
    } else {
      setPlayerTracks((currentTracks) =>
        (currentTracks || []).map(t =>
          t.id === track.id
            ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
            : t
        )
      )
      toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{track.playerName}</DialogTitle>
              <DialogDescription className="space-y-1">
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <Badge
                    className={
                      track.status === 'active' ? 'status-active' :
                      track.status === 'cancelled' ? 'status-cancelled' :
                      'status-concluded'
                    }
                  >
                    {STATUS_LABELS[track.status]}
                  </Badge>
                  <Badge variant="outline">{STAGE_LABELS[track.currentStage]}</Badge>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold break-words">{formatCurrency(track.trackVolume)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Probabilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold">{probability}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Volume Ponderado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl md:text-2xl font-bold break-words">{formatCurrency(weighted)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Estágio</label>
            <Select value={track.currentStage} onValueChange={handleStageChange} disabled={track.status !== 'active'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nda">{STAGE_LABELS.nda}</SelectItem>
                <SelectItem value="analysis">{STAGE_LABELS.analysis}</SelectItem>
                <SelectItem value="proposal">{STAGE_LABELS.proposal}</SelectItem>
                <SelectItem value="negotiation">{STAGE_LABELS.negotiation}</SelectItem>
                <SelectItem value="closing">{STAGE_LABELS.closing}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={track.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                <SelectItem value="concluded">{STATUS_LABELS.concluded}</SelectItem>
                <SelectItem value="cancelled">{STATUS_LABELS.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {track.notes && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Notas</h3>
            <p className="text-sm text-muted-foreground">{track.notes}</p>
          </div>
        )}

        <Separator className="my-4" />

        <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as ViewType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="list">
              <ListChecks className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <KanbanIcon className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="gantt">
              <ChartLine className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Gantt</span>
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarBlank className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="fields">
              <Tag className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Campos</span>
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkle className="mr-0 md:mr-2" />
              <span className="hidden md:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="comments">
              <ChatCircle className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Comentários</span>
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Docs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <TaskList playerTrackId={track.id} />
          </TabsContent>

          <TabsContent value="kanban" className="mt-4">
            <PlayerKanban playerTrackId={track.id} />
          </TabsContent>

          <TabsContent value="gantt" className="mt-4">
            <PlayerGantt playerTrackId={track.id} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <PlayerCalendar playerTrackId={track.id} />
          </TabsContent>

          <TabsContent value="fields" className="space-y-4">
            {currentUser && (
              <CustomFieldsRenderer
                entityId={track.id}
                entityType="track"
                currentUser={currentUser}
                mode="edit"
              />
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <AINextSteps trackId={track.id} currentStage={track.currentStage} />
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {currentUser && (
              <CommentsPanel
                entityId={track.id}
                entityType="track"
                currentUser={currentUser}
              />
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {currentUser && (
              <DocumentManager
                entityId={track.id}
                entityType="track"
                currentUser={currentUser}
                entityName={track.playerName}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {validationResult && pendingStageChange && (
        <PhaseValidationDialog
          open={validationDialogOpen}
          onOpenChange={setValidationDialogOpen}
          currentStage={track.currentStage}
          targetStage={pendingStageChange}
          validationResult={validationResult}
          onConfirm={handleValidationConfirm}
        />
      )}
    </Dialog>
  )
}
