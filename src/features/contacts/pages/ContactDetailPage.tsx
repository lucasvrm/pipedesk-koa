import { useParams, useNavigate, Link } from 'react-router-dom'
import { useContact, useUpdateContact } from '@/services/contactService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, Buildings, User, Envelope, Phone, LinkedinLogo, FileText } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ContactUpdate } from '@/services/contactService'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/PageContainer'
import { useAuth } from '@/contexts/AuthContext'
import DocumentManager from '@/components/DocumentManager'
import { renderNewBadge, renderUpdatedTodayBadge } from '@/components/ui/ActivityBadges'

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: contact, isLoading, error } = useContact(id)
  const { profile } = useAuth()
  const updateContact = useUpdateContact()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ContactUpdate>({})

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        linkedin: contact.linkedin,
        notes: contact.notes,
      })
    }
  }, [contact])

  const handleSave = async () => {
    if (!id) return
    try {
      await updateContact.mutateAsync({ id, data: formData })
      toast.success('Contato atualizado!')
      setIsEditing(false)
    } catch (err) {
      toast.error('Erro ao salvar contato')
    }
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-8"/><Skeleton className="h-64 w-full"/></div>
  if (error || !contact) return <div className="p-8 text-center text-muted-foreground">Contato não encontrado.</div>

  const companyName = (contact as any).companyName
  const companyId = contact.companyId

  return (
    <PageContainer className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/contacts">Contatos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {companyName && companyId && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/companies/${companyId}`}>{companyName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{contact.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
           <div className="flex items-center gap-2 flex-wrap">
             <h1 className="text-3xl font-bold tracking-tight">{contact.name}</h1>
             {renderNewBadge(contact.createdAt)}
             {renderUpdatedTodayBadge(contact.updatedAt)}
           </div>
           {companyName ? (
             <div
                className="flex items-center gap-1 text-muted-foreground hover:text-primary cursor-pointer w-fit"
                onClick={() => navigate(`/companies/${companyId}`)}
             >
                <Buildings className="w-4 h-4" />
                <span>{companyName}</span>
             </div>
           ) : (
             <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Buildings className="w-4 h-4 opacity-50" /> Sem empresa vinculada
             </span>
           )}
        </div>
        <RequirePermission permission="contacts.update">
            {isEditing ? (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={updateContact.isPending}>Salvar</Button>
                </div>
            ) : (
                <Button onClick={() => setIsEditing(true)}>Editar</Button>
            )}
        </RequirePermission>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/40 border rounded-lg">
          <TabsTrigger value="overview" className="py-2 px-4"><User className="mr-2 h-4 w-4" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="documents" className="py-2 px-4"><FileText className="mr-2 h-4 w-4" /> Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Info */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Nome Completo</Label>
                        {isEditing ? (
                            <Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                        ) : (
                            <div className="text-base">{contact.name}</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Cargo / Role</Label>
                            {isEditing ? (
                                <Input value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} />
                            ) : (
                                <div className="text-sm">{contact.role || '-'}</div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>LinkedIn</Label>
                            {isEditing ? (
                                <Input value={formData.linkedin || ''} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." />
                            ) : contact.linkedin ? (
                                <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                    <LinkedinLogo /> Perfil
                                </a>
                            ) : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Notas</Label>
                        {isEditing ? (
                            <Textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="min-h-[100px]" />
                        ) : (
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/20 p-3 rounded-md">
                                {contact.notes || 'Nenhuma observação.'}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Contact Details Side */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">E-mail</Label>
                        {isEditing ? (
                            <Input value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                        ) : (
                            <div className="flex items-center gap-2 text-sm break-all">
                                <Envelope className="w-4 h-4 text-muted-foreground" />
                                {contact.email ? <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a> : '-'}
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Telefone</Label>
                        {isEditing ? (
                            <Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        ) : (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                {contact.phone || '-'}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          {profile && id && (
            <DocumentManager
              entityId={id}
              entityType="contact"
              currentUser={profile}
              entityName={contact.name}
            />
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
