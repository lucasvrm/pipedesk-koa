import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLead, useUpdateLead, useLeadContacts, addLeadMember, removeLeadMember } from '@/services/leadService'
import { useCreateContact } from '@/services/contactService'
import { useUsers } from '@/services/userService'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/services/activityService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowLeft,
  Buildings,
  ChatCircle,
  CheckCircle,
  ClockCounterClockwise,
  Envelope,
  FileText,
  Globe,
  Phone,
  Plus,
  Sparkle,
  Tag,
  Users,
  XCircle
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LEAD_ORIGIN_LABELS, LEAD_STATUS_LABELS, LeadStatus, OPERATION_LABELS, OperationType } from '@/lib/types'
import { QualifyLeadDialog } from '../components/QualifyLeadDialog'
import CommentsPanel from '@/components/CommentsPanel'
import ActivityHistory from '@/components/ActivityHistory'
import DocumentManager from '@/components/DocumentManager'
import TagSelector from '@/components/TagSelector'
import { PageContainer } from '@/components/PageContainer'
import { toast } from 'sonner'

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()

  const { data: lead, isLoading } = useLead(id!)
  const updateLead = useUpdateLead()
  const { addContact } = useLeadContacts(id || '')
  const createContact = useCreateContact()
  const { data: users } = useUsers()

  const [qualifyOpen, setQualifyOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', role: '', isPrimary: false })
  const [selectedMember, setSelectedMember] = useState('')
  const [memberRole, setMemberRole] = useState<'owner' | 'collaborator' | 'watcher'>('collaborator')

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

  const statusBadge = useMemo(() => {
    if (!lead) return null
    const variant = lead.status === 'qualified' ? 'default' : lead.status === 'disqualified' ? 'destructive' : 'secondary'
    return (
      <Badge variant={variant} className="text-sm">
        {LEAD_STATUS_LABELS[lead.status]}
      </Badge>
    )
  }, [lead])

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

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate({ userId })
  }

  const createdAt = format(new Date(lead.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <PageContainer className="pb-16 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{lead.legalName}</h1>
              {statusBadge}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Criado em {createdAt}</span>
              <span className="opacity-50">•</span>
              <span>{LEAD_ORIGIN_LABELS[lead.origin]}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Select value={lead.status} onValueChange={(value: LeadStatus) => handleStatusChange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(lead.status === 'new' || lead.status === 'contacted') && (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDisqualify}>
              <XCircle className="mr-2 h-4 w-4" />
              Desqualificar
            </Button>
          )}

          {lead.status === 'qualified' ? (
            <Button variant="secondary" onClick={() => navigate(`/companies/${lead.qualifiedCompanyId}`)}>
              <Buildings className="mr-2 h-4 w-4" />
              Ver Empresa
            </Button>
          ) : (
            <Button onClick={() => setQualifyOpen(true)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Qualificar
            </Button>
          )}
        </div>
      </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Dados do Lead</CardTitle>
                  <div className="text-xs text-muted-foreground">Origem: {LEAD_ORIGIN_LABELS[lead.origin]}</div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Razão Social</Label>
                    <Input value={lead.legalName} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>Nome Fantasia</Label>
                    <Input value={lead.tradeName || ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>CNPJ</Label>
                    <Input value={lead.cnpj || ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>Segmento</Label>
                    <Input value={lead.segment || ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>Origem</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>{LEAD_ORIGIN_LABELS[lead.origin]}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Tipo de Operação</Label>
                    <Input value={lead.operationType ? (OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType) : ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>Website</Label>
                    <Input value={lead.website || ''} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>Cidade / Estado</Label>
                    <Input value={lead.addressCity ? `${lead.addressCity} - ${lead.addressState}` : ''} disabled />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label>Descrição</Label>
                    <Textarea value={lead.description || ''} disabled className="min-h-[90px]" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label>Tags</Label>
                    <TagSelector entityId={lead.id} entityType="lead" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-md flex items-center gap-2"><Users className="h-4 w-4" /> Contatos</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setContactModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {lead.contacts && lead.contacts.length > 0 ? (
                    <div className="divide-y">
                      {lead.contacts.map(contact => (
                        <div key={contact.id} className="p-3 hover:bg-muted/50 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {contact.name.charAt(0)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.role}</p>
                            <div className="flex gap-2 mt-1 text-muted-foreground">
                              {contact.email && <Envelope size={12} />}
                              {contact.phone && <Phone size={12} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum contato.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-md flex items-center gap-2"><Users className="h-4 w-4" /> Equipe</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setMemberModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {lead.members && lead.members.length > 0 ? (
                    <div className="divide-y">
                      {lead.members.map(member => (
                        <div key={member.userId} className="p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs">
                              {member.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.user?.name || 'Usuário'}</p>
                              <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum membro.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          {profile && <DocumentManager entityId={lead.id} entityType="lead" currentUser={profile} entityName={lead.legalName} />}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {user && <CommentsPanel entityId={lead.id} entityType="lead" currentUser={user} />}
        </TabsContent>

        <TabsContent value="activity">
          <ActivityHistory entityId={lead.id} entityType="lead" limit={50} />
        </TabsContent>
      </Tabs>

      {user && (
        <QualifyLeadDialog
          open={qualifyOpen}
          onOpenChange={setQualifyOpen}
          lead={lead}
          userId={user.id}
        />
      )}

      {/* Modal Adicionar Contato */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm ${contactModalOpen ? 'flex' : 'hidden'} items-center justify-center z-50`}>
        <div className="bg-card border rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Adicionar Contato</h3>
            <Button variant="ghost" size="icon" onClick={() => setContactModalOpen(false)}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Nome *</Label>
              <Input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
            </div>
            <div className="space-y-1 col-span-2">
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateContact} disabled={!newContact.name}>
              <Plus className="mr-2 h-4 w-4" /> Salvar contato
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Membro */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm ${memberModalOpen ? 'flex' : 'hidden'} items-center justify-center z-50`}>
        <div className="bg-card border rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Adicionar membro</h3>
            <Button variant="ghost" size="icon" onClick={() => setMemberModalOpen(false)}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label>Papel</Label>
              <Select value={memberRole} onValueChange={(v) => setMemberRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="collaborator">Colaborador</SelectItem>
                  <SelectItem value="watcher">Observador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMemberModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddMember} disabled={!selectedMember || addMemberMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
