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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { BuyingCommitteeCard } from '@/components/BuyingCommitteeCard'
import { UnifiedTimeline } from '@/components/UnifiedTimeline'
import { safeString, safeStringOptional } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
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
  CheckCircle,
  ClockCounterClockwise,
  Envelope,
  FileText,
  Phone,
  Plus,
  Tag,
  Users,
  X,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Tag as TagType, Contact } from '@/lib/types'
import { LeadStatus, OPERATION_LABELS, OperationType } from '@/lib/types'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'
import { QualifyLeadDialog } from '../components/QualifyLeadDialog'
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
import { ContactPreviewModal } from '../components/ContactPreviewModal'
import { LeadDetailQuickActions } from '../components/LeadDetailQuickActions'
import { LeadTemperatureBadge } from '../components/LeadTemperatureBadge'

const DEFAULT_TAG_COLOR = '#3b82f6'
// Layout offset calculation: global header (h-16 = 64px) + sticky topbar (~57px) = ~121px
const HEADER_OFFSET_PX = 121

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()

  // 🔹 Chamada ÚNICA ao hook de metadata
  const { leadStatuses, getLeadStatusById, getLeadOriginById } = useSystemMetadata()

  const { data: lead, isLoading } = useLead(id!)
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const { addContact, removeContact } = useLeadContacts(id || '')
  const createContact = useCreateContact()
  const { data: contacts } = useContacts()
  const { data: users } = useUsers()
  const { data: operationTypes } = useOperationTypes()
  const { data: leadTags } = useEntityTags(id || '', 'lead')
  
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
  const [previewContact, setPreviewContact] = useState<Contact | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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
    const statusMeta = getLeadStatusById(lead.leadStatusId)
    return (
      <StatusBadge
        semanticStatus={leadStatusMap(statusMeta?.code as any)}
        label={safeString(statusMeta?.label, lead.leadStatusId)}
        className="text-sm"
      />
    )
  }, [lead, getLeadStatusById])

  const operationTypeName = useMemo(() => {
    if (!lead?.operationType) return ''
    const found = operationTypes?.find(op => op.id === lead.operationType)
    return safeString(found?.name, OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType)
  }, [lead?.operationType, operationTypes])

  // Get primary contact for quick actions
  const primaryContact = useMemo(() => {
    if (!lead?.contacts || lead.contacts.length === 0) return null
    // Find primary contact or use the first one
    const primary = lead.contacts.find(c => c.isPrimary) || lead.contacts[0]
    return primary
  }, [lead?.contacts])

  const handleOpenContactPreview = (contact: Contact) => {
    setPreviewContact(contact)
    setIsPreviewOpen(true)
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

  // Check if lead is qualified - show informative message with navigation options
  if (lead.qualifiedAt) {
    const safeLeadName = safeString(lead.legalName, 'Lead')
    return (
      <PageContainer>
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/leads">Leads</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{safeLeadName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-xl">Lead Qualificado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              O lead <strong>{safeLeadName}</strong> foi qualificado e convertido em um negócio.
              Leads qualificados não são mais exibidos na lista de leads ativos.
            </p>
            <p className="text-sm text-muted-foreground">
              Para visualizar os detalhes do negócio associado, utilize os links abaixo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {lead.qualifiedMasterDealId && (
                <Button asChild>
                  <Link to={`/deals/${lead.qualifiedMasterDealId}`}>
                    <Buildings className="mr-2 h-4 w-4" />
                    Ver Negócio Associado
                  </Link>
                </Button>
              )}
              {lead.qualifiedCompanyId && (
                <Button variant="outline" asChild>
                  <Link to={`/companies/${lead.qualifiedCompanyId}`}>
                    <Buildings className="mr-2 h-4 w-4" />
                    Ver Empresa
                  </Link>
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link to="/leads">
                  Voltar para Leads
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const safeLeadName = safeString(lead.legalName, 'Lead sem nome')
  const safeTradeName = safeStringOptional(lead.tradeName)
  const safeCnpj = safeStringOptional(lead.cnpj) ?? ''
  const safeSegment = safeStringOptional(lead.segment) ?? ''
  const safeWebsite = safeStringOptional(lead.website) ?? ''
  const safeOperationType = safeStringOptional(lead.operationType) ?? ''
  const safeAddressCity = safeStringOptional(lead.addressCity)
  const safeAddressState = safeStringOptional(lead.addressState)
  const safeDescription = safeStringOptional(lead.description) ?? ''
  const safeOriginLabel = safeString(getLeadOriginById(lead.leadOriginId)?.label, lead.leadOriginId)

  const handleStatusChange = async (value: string) => { // value is ID now
    if (!lead) return
    const statusMeta = getLeadStatusById(value)
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { leadStatusId: value } })
      if (profile) {
        // const statusMeta = getLeadStatusById(value) // Already fetched above
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
      const disqualifiedStatus = leadStatuses.find(s => s.code === 'disqualified')
      if (disqualifiedStatus) {
        await updateLead.mutateAsync({ id: lead.id, data: { leadStatusId: disqualifiedStatus.id } })
        if (profile) logActivity(lead.id, 'lead', 'Lead desqualificado', profile.id)
      } else {
        toast.error('Status "desqualificado" não encontrado no sistema.')
      }
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
  const cityState = safeAddressCity && safeAddressState ? `${safeAddressCity} - ${safeAddressState}` : safeAddressCity || safeAddressState || ''

  return (
    <PageContainer className="p-0 space-y-0">
      {/* Header with Breadcrumb + Quick Actions - sticky below global header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/leads">Leads</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{safeLeadName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Quick Actions in header */}
        <div className="flex items-center gap-1">
          <LeadDetailQuickActions
            leadId={lead.id}
            primaryContact={primaryContact}
          />
        </div>
      </header>

      {/* Container das 3 Colunas - uses HEADER_OFFSET_PX constant for height calculation */}
      <main className={`flex gap-4 px-6 py-4 min-h-[calc(100vh-${HEADER_OFFSET_PX}px)] bg-slate-50`}>
        
        {/* COLUNA 1 - Dados do Lead (260px fixed) */}
        <aside className="w-[260px] min-w-[260px] bg-white rounded-lg border overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* 1. Badge da fase atual + Temperatura */}
            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge}
              <LeadTemperatureBadge priorityBucket={lead.priorityBucket} />
            </div>

            {/* 2. Título do Lead */}
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {safeLeadName}
                {renderNewBadge(lead.createdAt)}
                {renderUpdatedTodayBadge(lead.updatedAt)}
              </h1>
              <p className="text-sm text-slate-500">{safeTradeName || 'Lead'}</p>
            </div>

            {/* 3. Campos principais */}
            <div className="space-y-3 pt-2 border-t">
              
              {/* Responsável */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Responsável</label>
                <p className="text-sm text-slate-900 mt-0.5">{lead.owner?.name || 'Não atribuído'}</p>
              </div>

              {/* Origem */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Origem</label>
                <p className="text-sm text-slate-900 mt-0.5">{safeOriginLabel || '-'}</p>
              </div>

              {/* Cidade/UF */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cidade/UF</label>
                <p className="text-sm text-slate-900 mt-0.5">{cityState || '-'}</p>
              </div>

              {/* Operação */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Operação</label>
                <p className="text-sm text-slate-900 mt-0.5">{operationTypeName || '-'}</p>
              </div>

              {/* Data de criação */}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Criado em</label>
                <p className="text-sm text-slate-900 mt-0.5">{createdAt}</p>
              </div>
            </div>

            {/* 4. Tags */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </label>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setTagManagerOpen(true)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {leadTags && leadTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {leadTags.map(tag => {
                    const safeColor = safeStringOptional(tag.color) ?? DEFAULT_TAG_COLOR
                    const safeTagName = safeString(tag.name, 'Tag')

                    return (
                      <div
                        key={tag.id}
                        className="group inline-flex items-center gap-1 rounded-md border border-muted-foreground/20 bg-muted/30 px-2 py-0.5 text-xs transition-all hover:bg-muted"
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: safeColor }} />
                        <span className="font-medium max-w-[80px] truncate" style={{ color: safeColor }}>{safeTagName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 -mr-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleUnassignTag(tag.id)}
                          title="Remover"
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )
                  })}
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
            </div>

          </div>
        </aside>

        {/* COLUNA 2 - Timeline & Contexto (flex-1) */}
        <section className="flex-1 bg-white rounded-lg border overflow-hidden flex flex-col">
          
          <Tabs defaultValue="contexto" className="flex flex-col h-full">
            
            {/* Header das Abas - padrão DealDetailPage */}
            <div className="p-4 pb-0">
              <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/40 border rounded-lg">
                <TabsTrigger value="contexto" className="py-2 px-4">
                  <ClockCounterClockwise className="mr-2 h-4 w-4" /> Contexto
                </TabsTrigger>
                <TabsTrigger value="visao-geral" className="py-2 px-4">
                  <Buildings className="mr-2 h-4 w-4" /> Visão Geral
                </TabsTrigger>
                <TabsTrigger value="docs" className="py-2 px-4">
                  <FileText className="mr-2 h-4 w-4" /> Docs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Aba Contexto - Timeline completa */}
              <TabsContent value="contexto" className="h-full m-0 p-4">
                <UnifiedTimeline entityId={lead.id} entityType="lead" />
              </TabsContent>

              {/* Aba Visão Geral - Dados + Buying Committee */}
              <TabsContent value="visao-geral" className="h-full m-0 p-4 space-y-4 overflow-y-auto">
                
                {/* Dados Principais */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Dados Principais</CardTitle>
                    <CardDescription>Informações básicas do lead</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Razão Social</Label>
                      <Input value={safeLeadName} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Fantasia</Label>
                      <Input value={safeTradeName ?? ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input value={safeCnpj} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Segmento</Label>
                      <Input value={safeSegment} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={safeWebsite} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Operação</Label>
                      <Select value={safeOperationType} onValueChange={handleOperationTypeChange}>
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

                {/* Descrição */}
                <Card>
                  <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                    <p className="text-sm text-muted-foreground">Contexto adicional sobre a lead.</p>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={safeDescription} disabled className="min-h-[110px]" />
                  </CardContent>
                </Card>

                {/* Contatos / Buying Committee */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> Contatos do Lead</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setLinkContactOpen(true)}>
                          Vincular
                        </Button>
                        <Button size="sm" onClick={() => setContactModalOpen(true)}>
                          <Plus className="h-4 w-4" /> Novo
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Adicione contatos para este lead.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lead.contacts && lead.contacts.length > 0 ? (
                      lead.contacts.map(contact => (
                        <div key={contact.id} className="relative group">
                          <BuyingCommitteeCard 
                            contact={contact} 
                            onClick={() => handleOpenContactPreview(contact)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); handleRemoveContact(contact.id) }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={<Users className="h-12 w-12" />}
                        title="Nenhum contato mapeado"
                        description="Adicione contatos para este lead."
                        primaryAction={{
                          label: "Novo",
                          onClick: () => setContactModalOpen(true)
                        }}
                        secondaryAction={{
                          label: "Vincular",
                          onClick: () => setLinkContactOpen(true)
                        }}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Equipe */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Equipe</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setMemberModalOpen(true)}>
                        Vincular usuário existente
                      </Button>
                    </div>
                    <CardDescription>Controle de responsáveis e colaboradores</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {lead.members && lead.members.length > 0 ? (
                      <div className="divide-y">
                        {lead.members.map(member => (
                          <div key={member.userId} className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                                {safeStringOptional(member.user?.name)?.charAt(0) || 'U'}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-tight">{safeString(member.user?.name, 'Usuário')}</p>
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
                      <div className="text-center text-sm text-muted-foreground px-6 py-4">Nenhum membro vinculado.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Docs - Google Drive */}
              <TabsContent value="docs" className="h-full m-0 p-4">
                <DriveSection entityType="lead" entityId={lead.id} entityName={safeLeadName} />
              </TabsContent>

            </div>
          </Tabs>

        </section>

        {/* COLUNA 3 - Status & Próximas Ações */}
        <aside className="w-[240px] min-w-[240px] bg-white rounded-lg border overflow-y-auto">
          <div className="p-4 space-y-6">
            
            {/* ===== SEÇÃO 1: STATUS/FASES ===== */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Status do Lead
              </h3>
              
              <div className="space-y-1">
                {leadStatuses
                  .filter(status => status.isActive)
                  .map((status) => {
                    const isCurrentPhase = status.id === lead.leadStatusId
                    
                    return (
                      <button
                        key={status.id}
                        onClick={() => handleStatusChange(status.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                          "hover:bg-slate-50",
                          isCurrentPhase 
                            ? "bg-blue-50 border border-blue-200" 
                            : "opacity-50 hover:opacity-80"
                        )}
                      >
                        {/* Indicador visual */}
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full border-2 flex-shrink-0",
                          isCurrentPhase 
                            ? "bg-blue-600 border-blue-600" 
                            : "bg-transparent border-slate-300"
                        )} />
                        
                        {/* Nome da fase */}
                        <span className={cn(
                          "text-sm",
                          isCurrentPhase 
                            ? "font-medium text-blue-900" 
                            : "text-slate-600"
                        )}>
                          {status.label}
                        </span>
                        
                        {/* Indicador de fase atual */}
                        {isCurrentPhase && (
                          <span className="ml-auto text-xs text-blue-600">atual</span>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t" />

            {/* ===== SEÇÃO 2: PRÓXIMAS AÇÕES ===== */}
            <div>
              {/* Mock actions - will be replaced with real data */}
              {(() => {
                const mockActions = [
                  { id: '1', title: 'Ligar para cliente', date: 'Hoje, 14:00' },
                  { id: '2', title: 'Enviar proposta comercial', date: 'Amanhã' },
                  { id: '3', title: 'Agendar reunião de apresentação', date: 'Em 3 dias' },
                ]
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Próximas Ações
                      </h3>
                      <span className="text-xs text-slate-400">{mockActions.length} pendentes</span>
                    </div>
                    
                    {/* Lista de Ações (dados mockados por enquanto) */}
                    <div className="space-y-2">
                      {mockActions.map((action) => (
                        <div 
                          key={action.id}
                          className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
                        >
                          <Checkbox id={`action-${action.id}`} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <label 
                              htmlFor={`action-${action.id}`} 
                              className="text-sm text-slate-900 cursor-pointer block truncate"
                            >
                              {action.title}
                            </label>
                            <span className="text-xs text-slate-500">{action.date}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}

              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-slate-500 hover:text-slate-700"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Adicionar ação
              </Button>
            </div>

          </div>
        </aside>

      </main>

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

      <ContactPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        contact={previewContact}
      />
    </PageContainer>
  )
}
