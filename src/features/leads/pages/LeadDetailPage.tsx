import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLead, useUpdateLead, useLeadContacts, addLeadMember, removeLeadMember, useDeleteLead } from '@/services/leadService'
import { useContacts, useCreateContact } from '@/services/contactService'
import { useUsers } from '@/services/userService'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/services/activityService'
import { useEntityTags, useTagOperations } from '@/services/tagService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { EntityDetailLayout } from '@/components/detail-layout/EntityDetailLayout'
import { KeyMetricsSidebar } from '@/components/detail-layout/KeyMetricsSidebar'
import { PipelineVisualizer } from '@/components/detail-layout/PipelineVisualizer'
import { BuyingCommitteeCard } from '@/components/BuyingCommitteeCard'
import { UnifiedTimeline } from '@/components/UnifiedTimeline'
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
import { LEAD_ORIGIN_LABELS, LEAD_STATUS_LABELS, LeadStatus, OPERATION_LABELS, OperationType } from '@/lib/types'
import { QualifyLeadDialog } from '../components/QualifyLeadDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'
import { SmartTagSelector } from '@/components/SmartTagSelector'
import { PageContainer } from '@/components/PageContainer'
import { LeadEditSheet } from '../components/LeadEditSheet'
import { LeadDeleteDialog } from '../components/LeadDeleteDialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useOperationTypes } from '@/services/operationTypeService'

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()

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
    const variant = lead.status === 'qualified' ? 'default' : lead.status === 'disqualified' ? 'destructive' : 'secondary'
    return (
      <Badge variant={variant} className="text-sm">
        {LEAD_STATUS_LABELS[lead.status]}
      </Badge>
    )
  }, [lead])

  const operationTypeName = useMemo(() => {
    if (!lead?.operationType) return ''
    const found = operationTypes?.find(op => op.id === lead.operationType)
    return found?.name || OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType
  }, [lead?.operationType, operationTypes])

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (!lead) return <div className="p-8">Lead não encontrado.</div>

  const handleStatusChange = async (value: LeadStatus) => {
    if (!lead) return
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { status: value } })
      if (profile) {
        logActivity(lead.id, 'lead', `Status alterado para ${LEAD_STATUS_LABELS[value]}`, profile.id)
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
      if (profile) logActivity(lead.id, 'lead', `Contato ${contact.name} adicionado`, profile.id)
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
    { label: 'Origem', value: LEAD_ORIGIN_LABELS[lead.origin], icon: <Sparkle className="h-3 w-3" /> },
    { label: 'Criado em', value: createdAt, icon: <ClockCounterClockwise className="h-3 w-3" /> },
    { label: 'Cidade/UF', value: cityState || '-', icon: <Buildings className="h-3 w-3" /> },
    { label: 'Operação', value: operationTypeName || '-', icon: <Tag className="h-3 w-3" /> }
  ]

  return (
    <PageContainer>
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
              title={lead.legalName}
              subtitle={lead.tradeName}
              statusBadge={statusBadge}
              metrics={SIDEBAR_METRICS}
              actions={
                <div className="flex flex-col gap-2">
                  {lead.status === 'qualified' ? (
                    <Button variant="default" className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate(`/companies/${lead.qualifiedCompanyId}`)}>
                      <Buildings className="mr-2 h-4 w-4" />
                      Ver Empresa
                    </Button>
                  ) : (
                    <Button onClick={() => setQualifyOpen(true)} className="w-full bg-green-600 hover:bg-green-700">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Qualificar
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                      <PencilSimple className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    {(lead.status === 'new' || lead.status === 'contacted') && (
                      <Button variant="outline" className="text-destructive hover:text-destructive border-destructive/30" onClick={handleDisqualify}>
                        <XCircle className="mr-2 h-4 w-4" /> Desq.
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" className="text-destructive hover:text-destructive w-full" onClick={() => setDeleteOpen(true)}>
                    <Trash className="mr-2 h-4 w-4" /> Excluir Lead
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
                {leadTags && leadTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {leadTags.map(tag => (
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
              <TabsTrigger value="comments" className="py-2 px-4"><ChatCircle className="mr-2 h-4 w-4" /> Comentários</TabsTrigger>
              <TabsTrigger value="activity" className="py-2 px-4"><ClockCounterClockwise className="mr-2 h-4 w-4" /> Atividades</TabsTrigger>
              <TabsTrigger value="ai" disabled className="py-2 px-4 opacity-50 cursor-not-allowed"><Sparkle className="mr-2 h-4 w-4" /> IA</TabsTrigger>
              <TabsTrigger value="fields" disabled className="py-2 px-4 opacity-50 cursor-not-allowed"><Tag className="mr-2 h-4 w-4" /> Campos</TabsTrigger>
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
                                {op.name}
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
                      <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                        Nenhum contato mapeado.
                      </div>
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
              {profile && <DocumentManager entityId={lead.id} entityType="lead" currentUser={profile} entityName={lead.legalName} />}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
               {/* Replaced by Unified Timeline */}
              <UnifiedTimeline entityId={lead.id} entityType="lead" />
            </TabsContent>

            <TabsContent value="activity">
              {/* Legacy Activity kept as backup/alternative view if needed, or redirected to unified */}
              <ActivityHistory entityId={lead.id} entityType="lead" limit={50} />
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
                      value={`${contact.name} ${contact.email} ${contact.phone}`}
                      onSelect={() => setSelectedContact(contact.id)}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2',
                        selectedContact === contact.id && 'bg-primary/5'
                      )}
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-tight">{contact.name}</p>
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
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
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
