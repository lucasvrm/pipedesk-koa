import { useState } from 'react'
import { useTracks, useUpdateTrack } from '@/services/trackService'
import { useUpdateDeal } from '@/services/dealService'
import { useTags, useTagOperations, useEntityTags, TAG_COLORS } from '@/services/tagService'
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
import { MasterDeal, User, STATUS_LABELS, OPERATION_LABELS, DealStatus, Tag } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { Plus, Users, ChatCircle, ClockCounterClockwise, FileText, Sparkle, Tag as TagIcon, X } from '@phosphor-icons/react'
import PlayerTracksList from './PlayerTracksList'
import CreatePlayerDialog from './CreatePlayerDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'
import DocumentGenerator from '@/components/DocumentGenerator'
import AINextSteps from '@/components/AINextSteps'
import CustomFieldsRenderer from '@/components/CustomFieldsRenderer'
import { toast } from 'sonner'

interface DealDetailDialogProps {
  deal: MasterDeal
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser?: User
}

export default function DealDetailDialog({ deal, open, onOpenChange, currentUser }: DealDetailDialogProps) {
  const { data: playerTracks } = useTracks()
  const { data: dealTags = [] } = useEntityTags(deal.id, 'deal')
  const { data: availableTags = [] } = useTags('deal')
  const updateDeal = useUpdateDeal()
  const updateTrack = useUpdateTrack()
  const tagOps = useTagOperations()

  const [createPlayerOpen, setCreatePlayerOpen] = useState(false)

  const dealTracks = (playerTracks || []).filter(t => t.masterDealId === deal.id)

  const handleStatusChange = (newStatus: DealStatus) => {
    if (newStatus === 'cancelled') {
      const activeTracks = dealTracks.filter(t => t.status === 'active')

      // Update all active tracks to cancelled
      activeTracks.forEach(track => {
        updateTrack.mutate({
          trackId: track.id,
          updates: { status: 'cancelled' }
        })
      })

      updateDeal.mutate({
        dealId: deal.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => {
          toast.success(`Negócio cancelado! ${activeTracks.length} player(s) foram cancelados automaticamente.`)
        },
        onError: () => toast.error('Erro ao atualizar status')
      })
    } else {
      updateDeal.mutate({
        dealId: deal.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => {
          toast.success(`Status do negócio atualizado para ${STATUS_LABELS[newStatus]}`)
        },
        onError: () => toast.error('Erro ao atualizar status')
      })
    }
  }

  const handleAddTag = async (tag: Tag) => {
    try {
        await tagOps.assign.mutateAsync({
            tagId: tag.id,
            entityId: deal.id,
            entityType: 'deal'
        });
        toast.success(`Tag ${tag.name} adicionada`);
    } catch (e) {
        toast.error('Erro ao adicionar tag');
    }
  }

  const handleRemoveTag = async (tag: Tag) => {
    try {
        await tagOps.unassign.mutateAsync({
            tagId: tag.id,
            entityId: deal.id,
            entityType: 'deal'
        });
        toast.success(`Tag ${tag.name} removida`);
    } catch (e) {
        toast.error('Erro ao remover tag');
    }
  }

  const unassignedTags = availableTags.filter(t => !dealTags.find(dt => dt.id === t.id));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2 flex items-center gap-2">
                    {deal.clientName}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {dealTags.map(tag => (
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
              <div className="ml-4 flex gap-2">
                <DocumentGenerator deal={deal} playerTracks={dealTracks} />
                <Select value={deal.status} onValueChange={(v) => handleStatusChange(v as DealStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="concluded">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
                  Fee (%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl md:text-2xl font-bold">{deal.feePercentage ? `${deal.feePercentage}%` : '—'}</p>
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
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="players">
                <Users className="mr-2" />
                Players
              </TabsTrigger>
              <TabsTrigger value="fields">
                <TagIcon className="mr-2" />
                Campos
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkle className="mr-2" />
                IA
              </TabsTrigger>
              <TabsTrigger value="comments">
                <ChatCircle className="mr-2" />
                Comentários
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="mr-2" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="activity">
                <ClockCounterClockwise className="mr-2" />
                Atividade
              </TabsTrigger>
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
                <PlayerTracksList tracks={dealTracks} currentUser={currentUser} />
              )}
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              {currentUser && (
                <CustomFieldsRenderer
                  entityId={deal.id}
                  entityType="deal"
                  currentUser={currentUser}
                  mode="edit"
                />
              )}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              {currentUser && (
                <AINextSteps dealId={deal.id} />
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              {currentUser && (
                <CommentsPanel
                  entityId={deal.id}
                  entityType="deal"
                  currentUser={currentUser}
                />
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {currentUser && (
                <DocumentManager
                  entityId={deal.id}
                  entityType="deal"
                  currentUser={currentUser}
                  entityName={deal.clientName}
                />
              )}
            </TabsContent>

            <TabsContent value="activity">
              <ActivityHistory
                entityId={deal.id}
                entityType="deal"
                limit={50}
              />
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
