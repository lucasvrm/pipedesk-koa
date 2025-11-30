import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContacts, useCreateContact, useDeleteContact, useUpdateContact } from '@/services/contactService'
import { useCompanies } from '@/services/companyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MagnifyingGlass, Funnel, User, Phone, Envelope, Plus, Trash, PencilSimple } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { COMPANY_TYPE_LABELS, CompanyType } from '@/lib/types'

export default function ContactsPage() {
  const navigate = useNavigate()

  // Filter States
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  const { data: contacts, isLoading } = useContacts(companyFilter)
  const { data: companies } = useCompanies()

  const createContact = useCreateContact()
  const deleteContact = useDeleteContact()
  const updateContact = useUpdateContact()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)

  // Create Form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCompanyId, setNewCompanyId] = useState<string | undefined>(undefined)

  const filteredContacts = contacts?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      await createContact.mutateAsync({
        data: {
          name: newName,
          email: newEmail,
          phone: newPhone,
          companyId: newCompanyId === 'none' ? null : newCompanyId
        },
        userId: 'temp-user'
      })
      setIsCreateOpen(false)
      resetForm()
      toast.success("Contato criado com sucesso!")
    } catch (error) {
      toast.error("Erro ao criar contato")
      console.error(error)
    }
  }

  const handleUpdate = async () => {
    if (!newName) return;
    try {
      await updateContact.mutateAsync({
        id: editingContact.id,
        data: {
          name: newName,
          email: newEmail,
          phone: newPhone,
          companyId: newCompanyId === 'none' ? null : newCompanyId
        }
      })
      setIsEditOpen(false)
      resetForm()
      toast.success("Contato atualizado!")
    } catch (error) {
      toast.error("Erro ao atualizar")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este contato?")) {
      try {
        await deleteContact.mutateAsync(id)
        toast.success("Contato excluído")
      } catch (error) {
        toast.error("Erro ao excluir")
      }
    }
  }

  const openEdit = (contact: any) => {
    setEditingContact(contact)
    setNewName(contact.name)
    setNewEmail(contact.email || '')
    setNewPhone(contact.phone || '')
    setNewCompanyId(contact.companyId || 'none')
    setIsEditOpen(true)
  }

  const resetForm = () => {
    setNewName('')
    setNewEmail('')
    setNewPhone('')
    setNewCompanyId(undefined)
    setEditingContact(null)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground">Base geral de contatos.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          <p className="text-muted-foreground">Base geral de contatos (Empresas e Leads).</p>
        </div>
        {/* Creation is usually context-dependent (inside Company or Lead), but could be generic here */}
        {/* For now, let's keep it read/search focused or generic add */}
        <Button variant="outline" disabled title="Adicione contatos através de Empresas ou Leads">
          Novo Contato
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Company Filter */}
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Empresas</SelectItem>
            {companies?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(companyFilter !== 'all' || search) && (
           <Button variant="ghost" onClick={() => { setSearch(''); setCompanyFilter('all'); }}>Limpar</Button>
        )}
        <Button variant="outline" size="icon">
          <Funnel className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
              <TableHead>Cargo/Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredContacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum contato encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts?.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-muted/50 group">
                <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                       <User /> {contact.name}
                       {contact.isPrimary && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">Principal</span>}
                    </div>
                    {contact.role && <div className="text-xs text-muted-foreground ml-6">{contact.role}</div>}
                  </TableCell>
                  <TableCell>
                    {contact.companyName ? (
                      <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/companies/${contact.companyId}`)}>
                        {contact.companyName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Sem empresa</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.companyType ? (
                      <Badge variant="outline">{COMPANY_TYPE_LABELS[contact.companyType as CompanyType] || contact.companyType}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{contact.role || '-'}</div>
                    <div className="text-xs text-muted-foreground">
                       {/* Ideally we would resolve company name here, but contact object only has companyId unless we join */}
                       {/* For now, generic list */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {contact.email && <div className="flex items-center gap-1"><Envelope size={12}/> {contact.email}</div>}
                      {contact.phone && <div className="flex items-center gap-1"><Phone size={12}/> {contact.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(contact.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(contact)}>
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(contact.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsCreateOpen(false); setIsEditOpen(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Atualize os dados do contato.' : 'Adicione um contato na base geral.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="João Silva" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="joao@exemplo.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {companies?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancelar</Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate} disabled={createContact.isPending || updateContact.isPending}>
              {(createContact.isPending || updateContact.isPending) ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
