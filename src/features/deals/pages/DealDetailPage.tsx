import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDeal, useUpdateDeal } from '@/services/dealService'
import { useTracks, useUpdateTrack } from '@/services/trackService'
import { logActivity } from '@/services/activityService'
import { useEntityTags, useTagOperations } from '@/services/tagService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { dealStatusMap } from '@/lib/statusMaps'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EntityDetailLayout } from '@/components/detail-layout/EntityDetailLayout'
import { KeyMetricsSidebar } from '@/components/detail-layout/KeyMetricsSidebar'
import { PipelineVisualizer } from '@/components/detail-layout/PipelineVisualizer'
import { BuyingCommitteeCard } from '@/components/BuyingCommitteeCard'
import { UnifiedTimeline } from '@/components/UnifiedTimeline'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { STATUS_LABELS, OPERATION_LABELS, DealStatus } from '@/lib/types'
import { formatCurrency, formatDate, isOverdue } from '@/lib/helpers'
import { 
  Plus, Users, ChatCircle, ClockCounterClockwise, 
  FileText, Sparkle, Tag, PencilSimple,
  Kanban as KanbanIcon, List as ListIcon, Buildings,
  DotsThreeOutline, Wallet, CalendarBlank, WarningCircle,
  FileArrowDown, CheckCircle, PauseCircle, XCircle, PlayCircle,
  ChartBar,
  CaretDown,
  X
} from '@phosphor-icons/react'

import DealPlayersKanban from '../components/DealPlayersKanban' 
import { SmartTagSelector } from '@/components/SmartTagSelector'
import { DroppedPlayersList } from '../components/DroppedPlayersList'
import CreatePlayerDialog from '../components/CreatePlayerDialog'
import { EditDealDialog } from '../components/EditDealDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'
import DocumentGenerator from '@/components/DocumentGenerator'
import AINextSteps from '@/components/AINextSteps'
import CustomFieldsRenderer from '@/components/CustomFieldsRenderer'
import { toast } from 'sonner'
import { PageContainer } from '@/components/PageContainer'
import { EmptyState } from '@/components/EmptyState'
import { renderNewBadge, renderUpdatedTodayBadge } from '@/components/ui/ActivityBadges'
import { RelationshipMap, RelationshipNode, RelationshipEdge } from '@/components/ui/RelationshipMap'
import { useLeads } from '@/services/leadService'

export default function DealDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()
  const { data: deal, isLoading } = useDeal(id || null)
  const { data: playerTracks } = useTracks()
  
  // Fetch related data for RelationshipMap
  const { data: allLeads } = useLeads()

  const PIPELINE_STAGES = [
    { id: 'analysis', label: 'Análise' },
    { id: 'tease', label: 'Tease' },
    { id: 'offer', label: 'Oferta' },
    { id: 'diligence', label: 'Diligência' },
    { id: 'concluded', label: 'Concluído' }
  ]
  const updateDeal = useUpdateDeal()
  const updateTrack = useUpdateTrack()
  const { data: dealTags, isLoading: isLoadingTags } = useEntityTags(id || '', 'deal')
  const tagOps = useTagOperations()

  console.log('[DealDetailPage] Tags:', { dealTags, isLoadingTags, dealId: id })
  
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false)
  const [editDealOpen, setEditDealOpen] = useState(false)
  const [docGeneratorOpen, setDocGeneratorOpen] = useState(false)
  const [playersView, setPlayersView] = useState<'active' | 'dropped'>('active')
  const [tagManagerOpen, setTagManagerOpen] = useState(false)

  const handleOpenAida = () => {
    if (!deal) {
      toast.error('Negócio não carregado. Tente novamente.')
      return
    }

    const projectId = deal.company?.id || deal.companyId

    if (!projectId) {
      toast.error('Vincule uma empresa ao negócio para abrir a Análise AIDA.')
      return
    }

    navigate(`/aida/${projectId}`)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <Skeleton className="h-5 w-24" />
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!deal) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Negócio não encontrado</h2>
        <Button onClick={() => navigate('/deals')}>Voltar para Lista</Button>
      </div>
    )
  }

  const allDealTracks = (playerTracks || []).filter(t => t.masterDealId === deal.id)
  const activeTracks = allDealTracks.filter(t => t.status !== 'cancelled')
  const droppedTracks = allDealTracks.filter(t => t.status === 'cancelled')

  // Build RelationshipMap data
  const relationshipData = useMemo(() => {
    if (!deal) return { nodes: [], edges: [] }

    const nodes: RelationshipNode[] = []
    const edges: RelationshipEdge[] = []
    const addedPlayerIds = new Set<string>() // Track added players for O(1) lookup

    // Add deal node (always present)
    nodes.push({
      id: deal.id,
      label: deal.clientName,
      type: 'deal'
    })

    // Add company node if available
    if (deal.company) {
      const companyId = deal.company.id
      nodes.push({
        id: companyId,
        label: deal.company.name,
        type: 'company'
      })
      edges.push({
        from: companyId,
        to: deal.id
      })

      // Find leads that qualified to this company
      const relatedLeads = allLeads?.filter(lead => lead.qualifiedCompanyId === companyId) || []
      relatedLeads.forEach(lead => {
        nodes.push({
          id: lead.id,
          label: lead.legalName,
          type: 'lead'
        })
        edges.push({
          from: lead.id,
          to: companyId
        })
      })
    }

    // Add players/tracks for this deal
    allDealTracks.forEach(track => {
      if (track.playerId && !addedPlayerIds.has(track.playerId)) {
        addedPlayerIds.add(track.playerId)
        nodes.push({
          id: track.playerId,
          label: track.playerName,
          type: 'player'
        })
      }
      if (track.playerId) {
        edges.push({
          from: deal.id,
          to: track.playerId
        })
      }
    })

    return { nodes, edges }
  }, [deal, allLeads, allDealTracks])

  const handleNodeClick = (node: RelationshipNode) => {
    const routes: Record<typeof node.type, string> = {
      lead: `/leads/${node.id}`,
      company: `/companies/${node.id}`,
      deal: `/deals/${node.id}`,
      player: `/players/${node.id}`
    }
    navigate(routes[node.type])
  }

  const handleUnassignTag = (tagId: string) => {
    if (!deal) return
    tagOps.unassign.mutate({ tagId, entityId: deal.id, entityType: 'deal' }, {
      onSuccess: () => toast.success('Tag removida'),
      onError: () => toast.error('Não foi possível remover a tag')
    })
  }

  const handleStatusChange = (newStatus: DealStatus) => {
    if (newStatus === 'cancelled') {
      const activeTracksList = activeTracks.filter(t => t.status === 'active')
      activeTracksList.forEach(track => {
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
          toast.success('Negócio cancelado e players atualizados.')
          if (currentUser) logActivity(deal.id, 'deal', `Status alterado para ${STATUS_LABELS[newStatus]}`, currentUser.id)
        },
        onError: () => toast.error('Erro ao atualizar status')
      })
    } else {
      updateDeal.mutate({
        dealId: deal.id,
        updates: { status: newStatus }
      }, {
        onSuccess: () => {
          toast.success(`Status atualizado para ${STATUS_LABELS[newStatus]}`)
          if (currentUser) logActivity(deal.id, 'deal', `Status alterado para ${STATUS_LABELS[newStatus]}`, currentUser.id)
        },
        onError: () => toast.error('Erro ao atualizar status')
      })
    }
  }

  const feeValue = deal.feePercentage && deal.volume ? (deal.volume * (deal.feePercentage / 100)) : 0;
  const feeDisplay = deal.feePercentage ? `${deal.feePercentage.toFixed(2).replace('.', ',')}%  |  ${formatCurrency(feeValue)}` : '—';
  
  const isDeadlineOverdue = deal.deadline ? isOverdue(deal.deadline.toString()) : false;
  const deadlineIconColor = isDeadlineOverdue ? 'text-red-500' : 'text-slate-500';

  const SIDEBAR_METRICS = [
    { label: 'Volume Total', value: formatCurrency(deal.volume), icon: <Wallet className="h-3 w-3" />, color: 'deal' as const },
    { label: 'Fee Estimado', value: feeDisplay, icon: <Sparkle className="h-3 w-3" />, color: 'deal' as const },
    { label: 'Prazo', value: formatDate(deal.deadline), icon: isDeadlineOverdue ? <WarningCircle className="h-3 w-3 text-red-500" /> : <CalendarBlank className="h-3 w-3" />, color: 'deal' as const },
    { label: 'Players Ativos', value: activeTracks.filter(t => t.status === 'active').length, icon: <Users className="h-3 w-3" />, color: 'deal' as const },
    { label: 'Empresa', value: deal.company ? deal.company.name : '—', icon: <Buildings className="h-3 w-3" />, color: 'company' as const }
  ]

  return (
    <PageContainer>
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/deals">Negócios</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {deal.company && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/companies/${deal.company.id}`}>{deal.company.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{deal.clientName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <EntityDetailLayout
        header={
          <PipelineVisualizer
            stages={PIPELINE_STAGES}
            currentStageId={deal.status}
            onStageClick={() => {}}
            readOnly
          />
        }
        sidebar={
          <>
            <KeyMetricsSidebar
              title={
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{deal.clientName}</span>
                  {renderNewBadge(deal.createdAt)}
                  {renderUpdatedTodayBadge(deal.updatedAt)}
                </div>
              }
              subtitle={OPERATION_LABELS[deal.operationType]}
              statusBadge={
                <StatusBadge
                  semanticStatus={dealStatusMap(deal.status)}
                  label={STATUS_LABELS[deal.status]}
                  className="font-normal"
                />
              }
              metrics={SIDEBAR_METRICS}
              actions={
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="default" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleOpenAida}>
                      <ChartBar className="mr-2 h-4 w-4" /> AIDA
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setEditDealOpen(true)} title="Editar">
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        Alterar Status <CaretDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuRadioGroup
                        value={deal.status}
                        onValueChange={(v) => handleStatusChange(v as DealStatus)}
                      >
                        <DropdownMenuRadioItem value="active">Ativo</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="on_hold">Em Espera</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="concluded">Concluído</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="cancelled">Cancelado</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost"
                    onClick={() => setDocGeneratorOpen(true)}
                    className="justify-start px-2"
                  >
                    <FileArrowDown className="mr-2 h-4 w-4" /> Gerar Documento
                  </Button>
                </div>
              }
            />

            {/* TAGS SECTION - Persistent in Sidebar */}
            <Card className="border-l-4 border-l-secondary shadow-sm">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Tags
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTagManagerOpen(true)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {dealTags && dealTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dealTags.map(tag => (
                      <div
                        key={tag.id}
                        className="group inline-flex items-center gap-1.5 rounded-md border border-muted-foreground/20 bg-muted/30 px-2 py-1 text-xs transition-all hover:bg-muted"
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color || '#3b82f6' }} />
                        <span className="font-medium max-w-[100px] truncate" style={{ color: tag.color }}>{tag.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 -mr-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleUnassignTag(tag.id)}
                          title="Remover"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded cursor-pointer hover:bg-muted/50"
                    onClick={() => setTagManagerOpen(true)}
                  >
                    + Adicionar Tag
                  </div>
                )}
                <SmartTagSelector
                  entityId={deal.id}
                  entityType="deal"
                  selectedTagIds={dealTags?.map(tag => tag.id) || []}
                  open={tagManagerOpen}
                  onOpenChange={setTagManagerOpen}
                />
              </CardContent>
            </Card>
          </>
        }
        content={
          <Tabs defaultValue="players" className="w-full space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/40 border rounded-lg">
              <TabsTrigger value="players" className="py-2 px-4">
                <Users className="mr-2 h-4 w-4" /> Players
              </TabsTrigger>
              <TabsTrigger value="documents" className="py-2 px-4">
                <FileText className="mr-2 h-4 w-4" /> Docs
              </TabsTrigger>
              <TabsTrigger value="comments" className="py-2 px-4">
                <ChatCircle className="mr-2 h-4 w-4" /> Comentários
              </TabsTrigger>
              <TabsTrigger value="activity" className="py-2 px-4">
                <ClockCounterClockwise className="mr-2 h-4 w-4" /> Atividades
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-4">
              {/* Relationship Map - Show only if we have relationships beyond the current entity */}
              {relationshipData.nodes.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mapa de Relacionamentos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Visualização da cadeia Lead → Empresa → Negócio → Player
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <RelationshipMap
                        nodes={relationshipData.nodes}
                        edges={relationshipData.edges}
                        onNodeClick={handleNodeClick}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center bg-muted p-1 rounded-md gap-2">
                  <Button
                    variant={playersView === 'active' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPlayersView('active')}
                  >
                    <KanbanIcon className="mr-2" />
                    Em Negociação ({activeTracks.length})
                  </Button>
                  <Button
                    variant={playersView === 'dropped' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPlayersView('dropped')}
                  >
                    <ListIcon className="mr-2" />
                    Dropped ({droppedTracks.length})
                  </Button>
                </div>

                <Button onClick={() => setCreatePlayerOpen(true)} size="sm">
                  <Plus className="mr-2" /> Adicionar Player
                </Button>
              </div>

              {playersView === 'active' ? (
                activeTracks.length === 0 ? (
                  <EmptyState
                    icon={<Users className="h-12 w-12" />}
                    title="Nenhum player ativo"
                    description="Adicione players para iniciar negociações e acompanhar propostas."
                    primaryAction={{
                      label: "Adicionar Primeiro Player",
                      onClick: () => setCreatePlayerOpen(true)
                    }}
                  />
                ) : (
                  <DealPlayersKanban tracks={activeTracks} currentUser={currentUser} />
                )
              ) : (
                <DroppedPlayersList tracks={droppedTracks} />
              )}
            </TabsContent>

            <TabsContent value="documents">
              {currentUser && (
                <DocumentManager
                  entityId={deal.id}
                  entityType="deal"
                  currentUser={currentUser}
                  entityName={deal.clientName}
                />
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-6">
               {/* Unified Timeline replaces Comments */}
              <UnifiedTimeline entityId={deal.id} entityType="deal" />
            </TabsContent>

            <TabsContent value="ai">
              {currentUser && <AINextSteps dealId={deal.id} />}
            </TabsContent>

            <TabsContent value="fields">
              {currentUser && (
                <CustomFieldsRenderer
                  entityId={deal.id}
                  entityType="deal"
                  currentUser={currentUser}
                  mode="edit"
                />
              )}
            </TabsContent>

            <TabsContent value="activity">
              <ActivityHistory entityId={deal.id} entityType="deal" limit={50} />
            </TabsContent>
          </Tabs>
        }
      />

      <CreatePlayerDialog 
        masterDeal={deal} 
        open={createPlayerOpen} 
        onOpenChange={setCreatePlayerOpen} 
      />

      <EditDealDialog
        deal={deal}
        open={editDealOpen}
        onOpenChange={setEditDealOpen}
      />
    </PageContainer>
  )
}
