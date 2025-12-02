import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLead, useUpdateLead } from '@/services/leadService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, CheckCircle, XCircle, User, Building, Phone, Envelope, Tag, Plus } from '@phosphor-icons/react'
import { LEAD_STATUS_LABELS, LEAD_ORIGIN_LABELS, OPERATION_LABELS, OperationType } from '@/lib/types'
import { QualifyLeadDialog } from '../components/QualifyLeadDialog'
import CommentsPanel from '@/components/CommentsPanel'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import TagSelector from '@/components/TagSelector'
import { PageContainer } from '@/components/PageContainer'

export default function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: lead, isLoading } = useLead(id!)
  const updateLead = useUpdateLead()

  const [qualifyOpen, setQualifyOpen] = useState(false)

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (!lead) return <div className="p-8">Lead não encontrado.</div>

  const handleDisqualify = async () => {
    if (confirm('Tem certeza que deseja desqualificar este lead?')) {
      await updateLead.mutateAsync({ id: lead.id, data: { status: 'disqualified' } })
    }
  }

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <header className="border px-6 py-4 flex items-center justify-between bg-card rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-xl font-bold">{lead.legalName}</h1>
               <Badge variant={lead.status === 'qualified' ? 'default' : lead.status === 'disqualified' ? 'destructive' : 'outline'}>
                 {LEAD_STATUS_LABELS[lead.status]}
               </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Criado em {format(new Date(lead.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.status === 'new' || lead.status === 'contacted' ? (
            <>
              <RequirePermission permission="leads.update">
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDisqualify}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Desqualificar
                </Button>
              </RequirePermission>
              <RequirePermission permission="leads.qualify">
                <Button onClick={() => setQualifyOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Qualificar
                </Button>
              </RequirePermission>
            </>
          ) : lead.status === 'qualified' ? (
             <Button variant="outline" onClick={() => navigate(`/companies/${lead.qualifiedCompanyId}`)}>
               Ver Empresa
             </Button>
          ) : null}
        </div>
      </header>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Info */}
        <div className="col-span-2 space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Dados da Empresa</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <span className="text-xs text-muted-foreground uppercase font-bold">CNPJ</span>
                     <p>{lead.cnpj || '-'}</p>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground uppercase font-bold">Segmento</span>
                     <p>{lead.segment || '-'}</p>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground uppercase font-bold">Origem</span>
                     <p>{LEAD_ORIGIN_LABELS[lead.origin]}</p>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground uppercase font-bold">Tipo de Operação</span>
                     <p>{lead.operationType ? (OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType) : '-'}</p>
                   </div>
                   <div>
                     <span className="text-xs text-muted-foreground uppercase font-bold">Website</span>
                     <p>{lead.website || '-'}</p>
                   </div>
                 </div>
                 <div>
                   <span className="text-xs text-muted-foreground uppercase font-bold">Endereço</span>
                   <p>{lead.addressCity ? `${lead.addressCity} - ${lead.addressState}` : '-'}</p>
                 </div>
                 <div>
                   <span className="text-xs text-muted-foreground uppercase font-bold">Tags</span>
                   <div className="mt-1">
                      <TagSelector entityId={lead.id} entityType="lead" variant="default" />
                   </div>
                 </div>
                 <div>
                   <span className="text-xs text-muted-foreground uppercase font-bold">Descrição</span>
                   <p className="text-sm text-muted-foreground mt-1">{lead.description || 'Sem descrição.'}</p>
                 </div>
               </CardContent>
             </Card>

             <Tabs defaultValue="comments">
               <TabsList>
                 <TabsTrigger value="comments">Comentários</TabsTrigger>
                 <TabsTrigger value="activity">Atividades</TabsTrigger>
               </TabsList>
               <TabsContent value="comments" className="space-y-4">
                 {user && <CommentsPanel entityId={lead.id} entityType="lead" currentUser={user} />}
               </TabsContent>
               <TabsContent value="activity" className="p-4 border rounded-md bg-card min-h-[200px]">
                 <p className="text-muted-foreground text-center">Timeline de atividades (Em breve)</p>
               </TabsContent>
             </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-md">Contatos</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => {}}><Plus className="h-4 w-4"/></Button>
              </CardHeader>
              <CardContent className="p-0">
                {lead.contacts && lead.contacts.length > 0 ? (
                  <div className="divide-y">
                    {lead.contacts.map(contact => (
                      <div key={contact.id} className="p-3 hover:bg-muted/50 flex items-start gap-3">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                           {contact.name.charAt(0)}
                         </div>
                         <div>
                           <p className="text-sm font-medium">{contact.name}</p>
                           <p className="text-xs text-muted-foreground">{contact.role}</p>
                           <div className="flex gap-2 mt-1">
                             {contact.email && <Envelope size={12} className="text-muted-foreground"/>}
                             {contact.phone && <Phone size={12} className="text-muted-foreground"/>}
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

            {/* Members */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-md">Equipe</CardTitle>
                <Button variant="ghost" size="sm"><Plus className="h-4 w-4"/></Button>
              </CardHeader>
              <CardContent className="p-0">
                {lead.members && lead.members.length > 0 ? (
                  <div className="divide-y">
                    {lead.members.map(member => (
                      <div key={member.userId} className="p-3 flex items-center gap-3">
                         <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs">
                           {member.user?.name?.charAt(0) || 'U'}
                         </div>
                         <div>
                           <p className="text-sm font-medium">{member.user?.name || 'Usuário'}</p>
                           <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                         </div>
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
      </div>

      {user && (
        <QualifyLeadDialog
          open={qualifyOpen}
          onOpenChange={setQualifyOpen}
          lead={lead}
          userId={user.id}
        />
      )}
    </PageContainer>
  )
}
