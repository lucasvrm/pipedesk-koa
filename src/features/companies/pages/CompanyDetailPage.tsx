import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCompany, createCompany, updateCompany, useCreateCompanyContact, useDeleteCompanyContact } from '@/services/companyService'
import { useDeals } from '@/services/dealService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import {
  ArrowLeft, FloppyDisk, Buildings, User, Plus, Trash,
  Phone, Envelope, Star, PencilSimple, X, ChartBar
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Company, COMPANY_TYPE_LABELS, CompanyType, STATUS_LABELS } from '@/lib/types'
import { formatCurrency } from '@/lib/helpers'

const INPUT_STYLE_SECONDARY = "disabled:opacity-100 disabled:cursor-default disabled:bg-transparent disabled:border-border/50 disabled:text-muted-foreground text-muted-foreground font-medium"
const INPUT_STYLE_PRIMARY = "disabled:opacity-100 disabled:cursor-default disabled:bg-transparent disabled:border-border/50 disabled:text-foreground text-foreground font-bold text-lg"

export default function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const isNew = id === 'new'
  const [isEditing, setIsEditing] = useState(isNew)

  // Dados da Empresa
  const { data: company, isLoading, refetch } = useCompany(isNew ? undefined : id)
  
  // Dados de Deals
  const { data: allDeals } = useDeals()
  const companyDeals = allDeals?.filter(d => d.companyId === id || (d as any).company_id === id) || []

  // Mutações de Contato
  const createContactMutation = useCreateCompanyContact()
  const deleteContactMutation = useDeleteCompanyContact()

  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    cnpj: '',
    site: '',
    type: 'outros',
    description: '',
  })

  const [newContact, setNewContact] = useState({
    name: '', role: '', email: '', phone: '', isPrimary: false
  })

  useEffect(() => {
    if (company) {
      setFormData({ ...company })
    }
  }, [company])

  const handleSave = async () => {
    if (!profile) return
    if (!formData.name) return toast.error('Nome é obrigatório')

    try {
      if (isNew) {
        const created = await createCompany(formData as any, profile.id)
        toast.success('Empresa criada com sucesso')
        navigate(`/companies/${created.id}`, { replace: true })
        setIsEditing(false)
      } else if (id) {
        await updateCompany(id, formData)
        toast.success('Empresa atualizada')
        setIsEditing(false)
        refetch()
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar')
    }
  }

  const handleAddContact = async () => {
    if (!profile || !id || isNew) return
    if (!newContact.name) return toast.error('Nome obrigatório')

    try {
      await createContactMutation.mutateAsync({
        contact: { ...newContact, playerId: id }, // playerId aqui representa companyId no service
        userId: profile.id
      })
      toast.success('Contato adicionado')
      setNewContact({ name: '', role: '', email: '', phone: '', isPrimary: false })
      setIsContactModalOpen(false)
    } catch (error) {
      toast.error('Erro ao adicionar contato')
    }
  }

  const handleCancel = () => {
    if (isNew) navigate('/companies')
    else {
      if (company) setFormData({ ...company })
      setIsEditing(false)
    }
  }

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  return (
    <div className="container mx-auto p-6 max-w-7xl pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/companies')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Buildings className="text-primary" />
              {isNew ? 'Nova Empresa' : (company?.name || formData.name)}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? 'Cadastre um novo cliente' : 'Gestão de cliente'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* BOTÃO AIDA (Exibido apenas se não for nova empresa) */}
          {!isNew && (
            <Button 
              variant="secondary" 
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 border"
              onClick={() => navigate(`/aida/${id}`)}
            >
              <ChartBar className="mr-2 h-4 w-4" />
              Análise AIDA
            </Button>
          )}

          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}><X className="mr-2"/> Cancelar</Button>
              <Button onClick={handleSave}><FloppyDisk className="mr-2"/> Salvar</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}><PencilSimple className="mr-2"/> Editar</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="deals" disabled={isNew}>Deals ({companyDeals.length})</TabsTrigger>
            </TabsList>

            {/* Aba Informações */}
            <TabsContent value="info">
              <Card>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome da Empresa *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      disabled={!isEditing}
                      className={INPUT_STYLE_PRIMARY}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input 
                      value={formData.cnpj} 
                      onChange={e => setFormData({...formData, cnpj: e.target.value})}
                      disabled={!isEditing}
                      className={INPUT_STYLE_SECONDARY}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site</Label>
                    <Input 
                      value={formData.site} 
                      onChange={e => setFormData({...formData, site: e.target.value})}
                      disabled={!isEditing}
                      className={INPUT_STYLE_SECONDARY}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tipo de Empresa</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(v: CompanyType) => setFormData({...formData, type: v})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={INPUT_STYLE_SECONDARY}><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPANY_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      disabled={!isEditing}
                      className={`${INPUT_STYLE_SECONDARY} h-24`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Deals */}
            <TabsContent value="deals">
              <Card>
                <CardHeader>
                  <CardTitle>Deals da Empresa</CardTitle>
                  <CardDescription>Histórico de oportunidades vinculadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Deal</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyDeals.length > 0 ? companyDeals.map(deal => (
                        <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/deals/${deal.id}`)}>
                          <TableCell className="font-medium">{deal.clientName}</TableCell>
                          <TableCell>{formatCurrency(deal.volume)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={
                                deal.status === 'active' ? 'bg-green-100 text-green-700' : 
                                deal.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }
                            >
                              {STATUS_LABELS[deal.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum deal encontrado.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Coluna Contatos (Lateral) */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User size={20}/> Contatos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isNew ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Salve para adicionar contatos.</div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {company?.contacts?.map(contact => (
                      <div key={contact.id} className="p-3 rounded-lg border bg-card text-sm relative group">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold flex items-center gap-2">
                            {contact.name}
                            {contact.isPrimary && <Star weight="fill" className="text-yellow-500 h-3 w-3" title="Principal"/>}
                          </span>
                          {isEditing && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={() => deleteContactMutation.mutate(contact.id)}>
                              <Trash size={14}/>
                            </Button>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs mb-2">{contact.role}</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {contact.email && <div className="flex items-center gap-2"><Envelope className="h-3 w-3"/> {contact.email}</div>}
                          {contact.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3"/> {contact.phone}</div>}
                        </div>
                      </div>
                    ))}
                    {(!company?.contacts || company.contacts.length === 0) && (
                      <p className="text-center text-muted-foreground text-sm py-4">Nenhum contato.</p>
                    )}
                  </div>
                  <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full"><Plus className="mr-2"/> Novo Contato</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Contato</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Nome</Label><Input value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})}/></div>
                        <div className="space-y-2"><Label>Cargo</Label><Input value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})}/></div>
                        <div className="space-y-2"><Label>Email</Label><Input value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})}/></div>
                        <div className="space-y-2"><Label>Telefone</Label><Input value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})}/></div>
                        <div className="flex items-center gap-2"><Checkbox checked={newContact.isPrimary} onCheckedChange={(c) => setNewContact({...newContact, isPrimary: !!c})}/><Label>Principal</Label></div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsContactModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddContact}>Salvar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}