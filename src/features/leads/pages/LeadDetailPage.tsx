import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLead, useUpdateLead, useLeadContacts, addLeadMember, removeLeadMember, useDeleteLead } from '@/services/leadService'
import { useContacts, useCreateContact } from '@/services/contactService'
import { useUsers } from '@/services/userService'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/services/activityService'
import { useEntityTags, useTagOperations } from '@/services/tagService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { leadStatusMap } from '@/lib/statusMaps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EntityDetailLayout } from '@/components/detail-layout/EntityDetailLayout'
import { KeyMetricsSidebar } from '@/components/detail-layout/KeyMetricsSidebar'
import { PipelineVisualizer } from '@/components/detail-layout/PipelineVisualizer'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { BuyingCommitteeCard } from '@/components/BuyingCommitteeCard'
import { UnifiedTimeline } from '@/components/UnifiedTimeline'
import { safeString } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Buildings,
  ChatCircle,
  CheckCircle,
  ClockCounterClockwise,
  Envelope,
  FileText,
  PencilSimple,
  Phone,
  Plus,
  Sparkle,
  Tag,
  Trash,
  Users,
  X,
  XCircle
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Tag as TagType } from '@/lib/types'
import { LeadStatus, OPERATION_LABELS, OperationType } from '@/lib/types'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { QualifyLeadDialog } from '../components/QualifyLeadDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DriveSection from '@/components/DriveSection'
import { SmartTagSelector } from '@/components/SmartTagSelector'
import { PageContainer } from '@/components/PageContainer'
import { LeadEditSheet } from '../components/LeadEditSheet'
import { LeadDeleteDialog } from '../components/LeadDeleteDialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useOperationTypes } from '@/services/operationTypeService'
import { EmptyState } from '@/components/EmptyState'
import { renderNewBadge, renderUpdatedTodayBadge } from '@/components/ui/ActivityBadges'
import { RelationshipMap, RelationshipNode, RelationshipEdge } from '@/components/ui/RelationshipMap'
import { useCompany } from '@/services/companyService'
import { useDeals } from '@/services/dealService'
import { useTracks } from '@/services/trackService'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getLeadQuickActions } from '@/hooks/useQuickActions'

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()

  // 🔹 Chamada ÚNICA ao hook de metadata
  const { getLeadStatusByCode, getLeadOriginByCode } = useSystemMetadata()
  // se algum dia precisar de leadStatuses:
  // const { leadStatuses, getLeadStatusByCode, getLeadOriginByCode } = useSystemMetadata()

  const { data: lead, isLoading } = useLead(id!)
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const { addContact, removeContact } = useLeadContacts(id || '')
  const createContact = useCreateContact()
  const { data: contacts } = useContacts()
  const { data: users } = useUsers()
  const { data: operationTypes } = useOperationTypes()
  const { data: leadTags } = useEntityTags(id || '', 'lead')
  
  // Fetch related data for RelationshipMap
  const { data: company } = useCompany(lead?.qualifiedCompanyId)
  const { data: allDeals } = useDeals()
  const { data: allTracks } = useTracks()
  const tagOps = useTagOperations()

  const [qualifyOpen, setQualifyOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [linkContactOpen, setLinkContactOpen] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', role: '', isPrimary: false })
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [selectedMember, setSelectedMember] = useState('')
  const [memberRole, setMemberRole] = useState<'owner' | 'collaborator' | 'watcher'>('collaborator')
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [editTagForm, setEditTagForm] = useState({ name: '', color: '#3b82f6' })
  const [deleteTag, setDeleteTag] = useState<TagType | null>(null)

  const addMemberMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'owner' | 'collaborator' | 'watcher' }) =>
      addLeadMember({ leadId: id || '', userId, role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads', id] })
      toast.success('Membro adicionado ao lead')
      if (profile) logActivity(id!, 'lead', 'Novo membro adicionado ao lead', profile.id)
    },
    onError: () => toast.error('Não foi possível adicionar membro')
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => removeLeadMember(id || '', userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads', id] })
      toast.success('Membro removido')
    },
    onError: () => toast.error('Não foi possível remover membro')
  })

  const handleDelete = async () => {
    if (!lead) return
    try {
      await deleteLead.mutateAsync(lead.id)
      toast.success('Lead excluído com sucesso')
      setDeleteOpen(false)
      navigate('/leads')
    } catch (error) {
      toast.error('Erro ao excluir lead')
    }
  }

  const statusBadge = useMemo(() => {
    if (!lead) return null
    const statusMeta = getLeadStatusByCode(lead.status)
    return (
      <StatusBadge
        semanticStatus={leadStatusMap(lead.status)}
        label={safeString(statusMeta?.label, lead.status)}
        className="text-sm"
      />
    )
  }, [lead, getLeadStatusByCode])

  const operationTypeName = useMemo(() => {
    if (!lead?.operationType) return ''
    const found = operationTypes?.find(op => op.id === lead.operationType)
    return safeString(found?.name, OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType)
  }, [lead?.operationType, operationTypes])

  // Build RelationshipMap data - Must be called before any early returns to follow Rules of Hooks
  const relationshipData = useMemo(() => {
    if (!lead) return { nodes: [], edges: [] }

    const nodes: RelationshipNode[] = []
    const edges: RelationshipEdge[] = []
    const addedPlayerIds = new Set<string>() // Track added players for O(1) lookup

    // Add lead node (always present)
    nodes.push({
      id: lead.id,
      label: lead.legalName,
      type: 'lead'
    })

    // Add company node if lead is qualified
    if (lead.qualifiedCompanyId && company) {
      nodes.push({
        id: company.id,
        label: company.name,
        type: 'company'
      })
      edges.push({
        from: lead.id,
        to: company.id
      })

      // Add deals associated with the company
      const companyDeals = allDeals?.filter(deal => 
        deal.companyId === company.id || deal.company_id === company.id
      ) || []
      companyDeals.forEach(deal => {
        nodes.push({
          id: deal.id,
          label: deal.clientName,
          type: 'deal'
        })
        edges.push({
          from: company.id,
          to: deal.id
        })

        // Add players/tracks for each deal
        const dealTracks = allTracks?.filter(track => track.masterDealId === deal.id) || []
        dealTracks.forEach(track => {
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
      })
    }

    return { nodes, edges }
  }, [lead, company, allDeals, allTracks])

  const handleNodeClick = (node: RelationshipNode) => {
    const routes: Record<typeof node.type, string> = {
      lead: `/leads/${node.id}`,
      company: `/companies/${node.id}`,
      deal: `/deals/${node.id}`,
      player: `/players/${node.id}`
    }
    navigate(routes[node.type])
  }

  if (isLoading) return (
    <PageContainer>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <Skeleton className="h-5 w-20" />
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </PageContainer>
  )
  if (!lead) return <div className="p-8">Lead não encontrado.</div>

  const handleStatusChange = async (value: LeadStatus) => {
    if (!lead) return
    const statusMeta = getLeadStatusByCode(value)
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { status: value } })
      if (profile) {
        const statusMeta = getLeadStatusByCode(value)
        logActivity(lead.id, 'lead', `Status alterado para ${safeString(statusMeta?.label, value)}`, profile.id)
      }
      toast.success('Status atualizado')
    } catch (error) {
      toast.error('Não foi possível atualizar o status')
    }
  }

  const handleOperationTypeChange = async (value: string) => {
    if (!lead) return
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { operationType: value as OperationType } })
      toast.success('Tipo de operação atualizado')
    } catch (error) {
      toast.error('Não foi possível atualizar o tipo de operação')
    }
  }

  const handleDisqualify = async () => {
    if (!lead) return
    if (confirm('Tem certeza que deseja desqualificar este lead?')) {
      await updateLead.mutateAsync({ id: lead.id, data: { status: 'disqualified' } })
      if (profile) logActivity(lead.id, 'lead', 'Lead desqualificado', profile.id)
    }
  }

  const handleCreateContact = async () => {
    if (!profile || !newContact.name) {
      toast.error('Preencha o nome do contato')
      return
    }

    try {
      const contact = await createContact.mutateAsync({ data: { ...newContact }, userId: profile.id })
      await addContact({ contactId: contact.id, isPrimary: newContact.isPrimary })
      await queryClient.invalidateQueries({ queryKey: ['leads', id] })
      if (profile) logActivity(lead.id, 'lead', `Contato ${safeString(contact.name, 'desconhecido')} adicionado`, profile.id)
      toast.success('Contato adicionado')
      setNewContact({ name: '', email: '', phone: '', role: '', isPrimary: false })
      setContactModalOpen(false)
    } catch (error) {
      toast.error('Erro ao adicionar contato')
    }
  }

  const handleAddMember = async () => {
    if (!selectedMember) return toast.error('Selecione um membro')
    await addMemberMutation.mutateAsync({ userId: selectedMember, role: memberRole })
    setSelectedMember('')
    setMemberRole('collaborator')
    setMemberModalOpen(false)
  }

  const handleLinkContact = async () => {
    if (!selectedContact) {
      toast.error('Selecione um contato')
      return
    }
    try {
      await addContact({ contactId: selectedContact })
      await queryClient.invalidateQueries({ queryKey: ['leads', id] })
      const contactName = contacts?.find(contact => contact.id === selectedContact)?.name
      if (profile && contactName) {
        logActivity(lead.id, 'lead', `Contato ${contactName} vinculado`, profile.id)
      }
      toast.success('Contato vinculado')
      setSelectedContact('')
      setLinkContactOpen(false)
    } catch (error) {
      toast.error('Não foi possível vincular o contato')
    }
  }

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate({ userId })
  }

  const handleRemoveContact = async (contactId: string) => {
    try {
      await removeContact(contactId)
      const contactName = lead.contacts?.find(contact => contact.id === contactId)?.name
      if (profile && contactName) {
        logActivity(lead.id, 'lead', `Contato ${contactName} desvinculado`, profile.id)
      }
      toast.success('Contato desvinculado')
    } catch (error) {
      toast.error('Não foi possível desvincular o contato')
    }
  }

  const handleStartEditTag = (tag: TagType) => {
    setEditingTag(tag)
    setEditTagForm({ name: tag.name, color: tag.color || '#3b82f6' })
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editTagForm.name.trim()) return
    try {
      await tagOps.update.mutateAsync({ id: editingTag.id, name: editTagForm.name.trim(), color: editTagForm.color })
      toast.success('Tag atualizada')
      setEditingTag(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tags'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'entity', 'lead', lead.id] })
      ])
    } catch (error) {
      toast.error('Não foi possível atualizar a tag')
    }
  }

  const handleUnassignTag = (tagId: string) => {
    tagOps.unassign.mutate({ tagId, entityId: lead.id, entityType: 'lead' }, {
      onSuccess: () => toast.success('Tag removida da lead'),
      onError: () => toast.error('Não foi possível remover a tag')
    })
  }

  const handleDeleteTag = async () => {
    if (!deleteTag) return
    try {
      await tagOps.remove.mutateAsync(deleteTag.id)
      toast.success('Tag excluída')
      setDeleteTag(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tags'] }),
        queryClient.invalidateQueries({ queryKey: ['tags', 'entity', 'lead', lead.id] })
      ])
    } catch (error) {
      toast.error('Erro ao excluir tag')
    }
  }

  const createdAt = format(new Date(lead.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const cityState = lead.addressCity && lead.addressState ? `${lead.addressCity} - ${lead.addressState}` : lead.addressCity || lead.addressState || ''

  const PIPELINE_STAGES = [
    { id: 'new', label: 'Novo', color: 'bg-slate-500' },
    { id: 'contacted', label: 'Contatado', color: 'bg-blue-500' },
    { id: 'qualified', label: 'Qualificado', color: 'bg-green-500' },
    { id: 'disqualified', label: 'Desqualificado', color: 'bg-red-500' }
  ]

  const SIDEBAR_METRICS = [
    { label: 'Origem', value: getLeadOriginByCode(lead.origin)?.label || lead.origin, icon: <Sparkle className="h-3 w-3" />, color: 'lead' as const },
    { label: 'Criado em', value: createdAt, icon: <ClockCounterClockwise className="h-3 w-3" />, color: 'lead' as const },
    { label: 'Cidade/UF', value: cityState || '-', icon: <Buildings className="h-3 w-3" />, color: 'lead' as const },
    { label: 'Operação', value: operationTypeName || '-', icon: <Tag className="h-3 w-3" />, color: 'lead' as const }
  ]

  return (
    <PageContainer>
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/leads">Leads</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lead.legalName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <EntityDetailLayout
        header={
          <PipelineVisualizer
            stages={PIPELINE_STAGES}
            currentStageId={lead.status}
            onStageClick={(id) => handleStatusChange(id as LeadStatus)}
          />
        }
        sidebar={
          <>
            <KeyMetricsSidebar
              title={
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{lead.legalName}</span>
                  {renderNewBadge(lead.createdAt)}
                  {renderUpdatedTodayBadge(lead.updatedAt)}
                </div>
              }
              subtitle={lead.tradeName}
              statusBadge={statusBadge}
              metrics={SIDEBAR_METRICS}
              actions={
                <QuickActionsMenu
                  label="Ações"
                  triggerVariant="outline"
                  triggerSize="default"
                  actions={getLeadQuickActions({
                    lead,
                    navigate,
                    updateLead,
                    deleteLead,
                    profileId: profile?.id,
                    onEdit: () => setEditOpen(true),
                    onQualify: () => setQualifyOpen(true),
                    onManageTags: () => setTagManagerOpen(true),
                  })}
                />
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
                {leadTags && leadTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {leadTags.map(tag => (
                      <div
                        key={tag.id}
                        className="group inline-flex items-center gap-1.5 rounded-md border border-muted-foreground/20 bg-muted/30 px-2 py-1 text-xs transition-all hover:bg-muted"
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color || '#3b82f6' }} />
                        <span className="font-medium max-w-[100px] truncate" style={{ color: tag.color }}>{safeString(tag.name, 'Tag')}</span>
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
                  entityId={lead.id}
                  entityType="lead"
                  selectedTagIds={leadTags?.map(tag => tag.id) || []}
                  open={tagManagerOpen}
                  onOpenChange={setTagManagerOpen}
                />
              </CardContent>
            </Card>
          </>
        }
        content={
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/40 border rounded-lg">
              <TabsTrigger value="overview" className="py-2 px-4"><Buildings className="mr-2 h-4 w-4" /> Visão Geral</TabsTrigger>
              <TabsTrigger value="documents" className="py-2 px-4"><FileText className="mr-2 h-4 w-4" /> Docs</TabsTrigger>
            <TabsTrigger value="timeline" className="py-2 px-4"><ClockCounterClockwise className="mr-2 h-4 w-4" /> Atividades</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Main Content Area - Reduced clutter since key info is in sidebar */}
              <div className="grid grid-cols-1 gap-6">

                <Card>
                  <CardHeader>
                    <CardTitle>Dados Principais</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Razão Social</Label>
                      <Input value={lead.legalName} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Fantasia</Label>
                      <Input value={lead.tradeName || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input value={lead.cnpj || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Segmento</Label>
                      <Input value={lead.segment || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={lead.website || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Operação</Label>
                      <Select value={lead.operationType || ''} onValueChange={handleOperationTypeChange}>
                        <SelectTrigger className="bg-background/60">
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {(operationTypes || [])
                            .filter(op => op.isActive)
                            .map(op => (
                              <SelectItem key={op.id} value={op.id}>
                                {safeString(op.name, 'Tipo de operação')}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                    <p className="text-sm text-muted-foreground">Contexto adicional sobre a lead.</p>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={lead.description || ''} disabled className="min-h-[110px]" />
                  </CardContent>
                </Card>

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
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="space-y-3 border-b pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Comitê de Compra</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setLinkContactOpen(true)}>
                          Vincular
                        </Button>
                        <Button size="sm" onClick={() => setContactModalOpen(true)}>
                          <Plus className="h-4 w-4" /> Novo
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Mapeie influenciadores e decisores.</p>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {lead.contacts && lead.contacts.length > 0 ? (
                      lead.contacts.map(contact => (
                        <div key={contact.id} className="relative">
                          <BuyingCommitteeCard contact={contact} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => handleRemoveContact(contact.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<Users className="h-12 w-12" />}
                        title="Nenhum contato mapeado"
                        description="Mapeie influenciadores e decisores do comitê de compra."
                        primaryAction={{
                          label: "Adicionar Contato",
                          onClick: () => setContactModalOpen(true)
                        }}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="space-y-3 border-b pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Equipe</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setMemberModalOpen(true)}>
                        Vincular usuário existente
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Controle de responsáveis e colaboradores.</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {lead.members && lead.members.length > 0 ? (
                      <div className="divide-y">
                        {lead.members.map(member => (
                          <div key={member.userId} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                                {member.user?.name?.charAt(0) || 'U'}
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-tight">{member.user?.name || 'Usuário'}</p>
                                <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Desvincular
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 text-center text-sm text-muted-foreground">Nenhum membro vinculado.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <DriveSection entityType="lead" entityId={lead.id} entityName={lead.legalName} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <UnifiedTimeline entityId={lead.id} entityType="lead" />
            </TabsContent>
          </Tabs>
        }
      />

      {user && (
        <QualifyLeadDialog
          open={qualifyOpen}
          onOpenChange={setQualifyOpen}
          lead={lead}
          userId={user.id}
        />
      )}

      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar novo contato</DialogTitle>
            <DialogDescription>Crie e vincule um contato sem sair da lead.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Nome *</Label>
              <Input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Cargo / Função</Label>
              <Input value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={newContact.isPrimary}
                onCheckedChange={(checked) => setNewContact({ ...newContact, isPrimary: Boolean(checked) })}
              />
              <span className="text-sm">Definir como contato principal</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateContact} disabled={!newContact.name}>
              <Plus className="mr-2 h-4 w-4" /> Salvar contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkContactOpen} onOpenChange={setLinkContactOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Vincular contato existente</DialogTitle>
            <DialogDescription>Pesquise contatos já cadastrados e vincule rapidamente.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Contato</Label>
            <Command className="border rounded-lg">
              <CommandInput placeholder="Busque por nome, email ou telefone" />
              <CommandList className="max-h-64">
                <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                <CommandGroup>
                  {contacts?.map(contact => (
                    <CommandItem
                      key={contact.id}
                      value={`${safeString(contact.name, '')} ${contact.email || ''} ${contact.phone || ''}`}
                      onSelect={() => setSelectedContact(contact.id)}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2',
                        selectedContact === contact.id && 'bg-primary/5'
                      )}
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {safeString(contact.name, 'C').charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-tight">{safeString(contact.name, 'Contato')}</p>
                        <p className="text-xs text-muted-foreground">{contact.role || 'Sem cargo'}</p>
                        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          {contact.email && <span className="inline-flex items-center gap-1"><Envelope className="h-3 w-3" /> {contact.email}</span>}
                          {contact.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>}
                        </div>
                      </div>
                      {selectedContact === contact.id && <Badge className="ml-auto">Selecionado</Badge>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setLinkContactOpen(false)}>Cancelar</Button>
            <Button onClick={handleLinkContact} disabled={!selectedContact}>
              <Plus className="mr-2 h-4 w-4" /> Vincular contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={memberModalOpen} onOpenChange={setMemberModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vincular usuário</DialogTitle>
            <DialogDescription>Selecione membros da equipe para acompanhar este lead.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                <SelectContent>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={u.id}>{safeString(u.name, 'Usuário')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={memberRole} onValueChange={(v) => setMemberRole(v as any)}>
                <SelectTrigger><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="collaborator">Colaborador</SelectItem>
                  <SelectItem value="watcher">Observador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setMemberModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddMember} disabled={!selectedMember || addMemberMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTag} onOpenChange={(open) => { if (!open) setEditingTag(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tag</DialogTitle>
            <DialogDescription>Ajuste nome e cor para manter o padrão visual.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editTagForm.name}
                onChange={(e) => setEditTagForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da tag"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  className="w-20 h-10 p-1"
                  value={editTagForm.color}
                  onChange={(e) => setEditTagForm(prev => ({ ...prev, color: e.target.value }))}
                />
                <span className="text-sm text-muted-foreground">{editTagForm.color}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setEditingTag(null)}>Cancelar</Button>
            <Button onClick={handleUpdateTag} disabled={tagOps.update.isPending || !editTagForm.name.trim()}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTag} onOpenChange={(open) => { if (!open) setDeleteTag(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir tag</DialogTitle>
            <DialogDescription>Essa ação removerá a tag do banco e de todas as entidades.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a tag <span className="font-semibold">{deleteTag?.name}</span>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteTag(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTag} disabled={tagOps.remove.isPending}>
              Excluir tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadEditSheet lead={lead} open={editOpen} onOpenChange={setEditOpen} />

      <LeadDeleteDialog
        lead={lead}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteLead.isPending}
      />
    </PageContainer>
  )
}
