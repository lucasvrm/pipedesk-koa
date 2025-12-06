import { useEffect, useState } from 'react'
import { useTracks, useUpdateTrack } from '@/services/trackService'
import { useDeals } from '@/services/dealService'
import { useStages } from '@/services/pipelineService'
import { useTags, useTagOperations, useEntityTags } from '@/services/tagService'
import { useSettings } from '@/services/systemSettingsService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { trackStatusMap } from '@/lib/statusMaps'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PlayerTrack, PlayerStage, DealStatus, STATUS_LABELS, ViewType, User, Tag } from '@/lib/types'
import { formatCurrency, calculateWeightedVolume, trackStageChange } from '@/lib/helpers'
import { ListChecks, Kanban as KanbanIcon, ChartLine, CalendarBlank, ChatCircle, Sparkle, FileText, ClockCounterClockwise, Tag as TagIcon, Clock, Plus, X } from '@phosphor-icons/react'
import TaskList from '@/features/tasks/components/TaskList'
import PlayerKanban from './PlayerKanban'
import PlayerGantt from './PlayerGantt'
import PlayerCalendar from './PlayerCalendar'
import CommentsPanel from '@/components/CommentsPanel'
import AINextSteps from '@/components/AINextSteps'
import DocumentManager from '@/components/DocumentManager'
import { ActivitySummarizer } from '@/components/ActivitySummarizer'
import { SLAIndicator } from '@/components/SLAIndicator'
import CustomFieldsRenderer from '@/components/CustomFieldsRenderer'
import PhaseValidationDialog from '@/components/PhaseValidationDialog'
import { validatePhaseTransition, PhaseTransitionRule, ValidationResult } from '@/lib/phaseValidation'
import { toast } from 'sonner'

interface PlayerTrackDetailDialogProps {
  track: PlayerTrack
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser?: User
}

export default function PlayerTrackDetailDialog({ track, open, onOpenChange, currentUser }: PlayerTrackDetailDialogProps) {
  const { data: playerTracks } = useTracks()
  const { data: stages = [] } = useStages()
  const { data: trackTags = [] } = useEntityTags(track.id, 'track')
  const { data: availableTags = [] } = useTags('track')
  const { data: settings } = useSettings()
  const updateTrack = useUpdateTrack()
  const { data: deals } = useDeals()
  const tagOps = useTagOperations()

  const [trackViewPreferences, setTrackViewPreferences] = useState<Record<string, ViewType>>({})
  const [phaseRules] = useState<PhaseTransitionRule[]>([])

  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [pendingStageChange, setPendingStageChange] = useState<PlayerStage | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const currentView = (trackViewPreferences || {})[track.id] || 'list'

  // Feature Flag Logic
  const tagsConfig = settings?.find(s => s.key === 'tags_config')?.value;
  const tagsEnabled = tagsConfig?.global && tagsConfig?.modules?.tracks !== false;

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

  const getStageInfo = (stageKey: string) => {
    return stages.find(s => s.id === stageKey) || 
           stages.find(s => s.name.toLowerCase().replace(/\s/g, '_') === stageKey) ||
           stages.find(s => s.isDefault);
  }

  const currentStageInfo = getStageInfo(track.currentStage);
  const probability = track.probability || currentStageInfo?.probability || 0;
  const stageName = currentStageInfo?.name || track.currentStage;
  const weighted = calculateWeightedVolume(track.trackVolume, probability)
  const masterDeal = (deals || []).find(d => d.id === track.masterDealId)

  const performStageChange = (newStageId: PlayerStage) => {
    const oldStage = track.currentStage
    const newStageInfo = getStageInfo(newStageId);

    trackStageChange(track.id, newStageId, oldStage)

    updateTrack.mutate({
      trackId: track.id,
      updates: {
        currentStage: newStageId,
        probability: newStageInfo?.probability || 0,
      }
    }, {
      onSuccess: () => toast.success(`Estágio atualizado para ${newStageInfo?.name || newStageId}`),
      onError: () => toast.error('Erro ao atualizar estágio')
    })
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
      updateTrack.mutate({ trackId: track.id, updates: { status: newStatus } })
      siblingTracks.forEach(sibling => {
        updateTrack.mutate({ trackId: sibling.id, updates: { status: 'cancelled' } })
      })
      toast.success(`Player concluído! ${siblingTracks.length} players concorrentes foram cancelados.`)
    } else {
      updateTrack.mutate({
        trackId: track.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`),
        onError: () => toast.error('Erro ao atualizar status')
      })
    }
  }

  // Tag Handlers
  const handleAddTag = async (tag: Tag) => {
    try {
        await tagOps.assign.mutateAsync({ tagId: tag.id, entityId: track.id, entityType: 'track' });
        toast.success(`Tag ${tag.name} adicionada`);
    } catch (e) { toast.error('Erro ao adicionar tag'); }
  }

  const handleRemoveTag = async (tag: Tag) => {
    try {
        await tagOps.unassign.mutateAsync({ tagId: tag.id, entityId: track.id, entityType: 'track' });
        toast.success(`Tag ${tag.name} removida`);
    } catch (e) { toast.error('Erro ao remover tag'); }
  }

  const unassignedTags = availableTags.filter(t => !trackTags.find(tt => tt.id === t.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{track.playerName}</DialogTitle>

              {tagsEnabled && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {trackTags.map(tag => (
                        <Badge
                            key={tag.id}
                            style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
                            variant="outline"
                            className="flex items-center gap-1 pl-2 pr-1 h-5 text-[10px]"
                        >
                            {tag.name}
                            <button onClick={() => handleRemoveTag(tag)} className="hover:bg-black/10 rounded-full p-0.5">
                                <X size={8} />
                            </button>
                        </Badge>
                    ))}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full border border-dashed">
                                <Plus size={10} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {unassignedTags.length === 0 ? (
                                <div className="p-2 text-xs text-muted-foreground">Sem tags disponíveis</div>
                            ) : (
                                unassignedTags.map(tag => (
                                    <DropdownMenuItem key={tag.id} onClick={() => handleAddTag(tag)}>
                                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                                        {tag.name}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              )}

              <DialogDescription className="space-y-1">
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <StatusBadge
                    semanticStatus={trackStatusMap(track.status)}
                    label={STATUS_LABELS[track.status]}
                  />
                  <Badge variant="outline" style={{ borderColor: currentStageInfo?.color, color: currentStageInfo?.color }}>
                    {stageName}
                  </Badge>
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
                {stages.filter(s => s.active || s.id === track.currentStage).map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
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
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 lg:grid-cols-10 overflow-x-auto">
            <TabsTrigger value="list"><ListChecks className="mr-0 md:mr-2" /><span className="hidden md:inline">Lista</span></TabsTrigger>
            <TabsTrigger value="kanban"><KanbanIcon className="mr-0 md:mr-2" /><span className="hidden md:inline">Kanban</span></TabsTrigger>
            <TabsTrigger value="gantt"><ChartLine className="mr-0 md:mr-2" /><span className="hidden md:inline">Gantt</span></TabsTrigger>
            <TabsTrigger value="calendar"><CalendarBlank className="mr-0 md:mr-2" /><span className="hidden md:inline">Calendário</span></TabsTrigger>
            <TabsTrigger value="fields"><TagIcon className="mr-0 md:mr-2" /><span className="hidden md:inline">Campos</span></TabsTrigger>
            <TabsTrigger value="ai"><Sparkle className="mr-0 md:mr-2" /><span className="hidden md:inline">IA</span></TabsTrigger>
            <TabsTrigger value="sla"><Clock className="mr-0 md:mr-2" /><span className="hidden md:inline">SLA</span></TabsTrigger>
            <TabsTrigger value="summary"><ClockCounterClockwise className="mr-0 md:mr-2" /><span className="hidden md:inline">Sumário</span></TabsTrigger>
            <TabsTrigger value="comments"><ChatCircle className="mr-0 md:mr-2" /><span className="hidden md:inline">Comentários</span></TabsTrigger>
            <TabsTrigger value="documents"><FileText className="mr-0 md:mr-2" /><span className="hidden md:inline">Docs</span></TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4"><TaskList playerTrackId={track.id} /></TabsContent>
          <TabsContent value="kanban" className="mt-4"><PlayerKanban playerTrackId={track.id} /></TabsContent>
          <TabsContent value="gantt" className="mt-4"><PlayerGantt playerTrackId={track.id} /></TabsContent>
          <TabsContent value="calendar" className="mt-4"><PlayerCalendar playerTrackId={track.id} /></TabsContent>
          <TabsContent value="fields" className="space-y-4">
            {currentUser && <CustomFieldsRenderer entityId={track.id} entityType="track" currentUser={currentUser} mode="edit" />}
          </TabsContent>
          <TabsContent value="ai" className="space-y-4"><AINextSteps trackId={track.id} currentStage={track.currentStage} /></TabsContent>
          <TabsContent value="sla" className="space-y-4">
            <Card><CardHeader><CardTitle>Monitoramento de SLA</CardTitle></CardHeader><CardContent><SLAIndicator playerTrackId={track.id} currentStage={track.currentStage} compact={false} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="summary" className="space-y-4"><ActivitySummarizer entityId={track.id} entityType="track" /></TabsContent>
          <TabsContent value="comments" className="space-y-4">{currentUser && <CommentsPanel entityId={track.id} entityType="track" currentUser={currentUser} />}</TabsContent>
          <TabsContent value="documents" className="space-y-4">{currentUser && <DocumentManager entityId={track.id} entityType="track" currentUser={currentUser} entityName={track.playerName} />}</TabsContent>
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
