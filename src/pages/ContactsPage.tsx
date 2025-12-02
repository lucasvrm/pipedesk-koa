import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContacts, useCreateContact, useDeleteContact, useUpdateContact } from '@/services/contactService'
import { useCompanies } from '@/services/companyService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MagnifyingGlass, User, Phone, Envelope, Plus, Trash, PencilSimple, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { COMPANY_TYPE_LABELS, CompanyType } from '@/lib/types'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import { SharedListLayout, SharedListFiltersBar } from '@/features/shared/components/SharedListLayout'

export default function ContactsPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { data: contacts, isLoading } = useContacts(companyFilter)
  const { data: companies } = useCompanies()

  const createContact = useCreateContact()
  const deleteContact = useDeleteContact()
  const updateContact = useUpdateContact()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCompanyId, setNewCompanyId] = useState<string | undefined>(undefined)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, companyFilter])

  const filteredContacts = useMemo(() => contacts?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  ) || [], [contacts, search])

  const totalContacts = filteredContacts.length
  const totalPages = Math.max(1, Math.ceil(totalContacts / itemsPerPage))
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredContacts.slice(start, start + itemsPerPage)
  }, [filteredContacts, currentPage, itemsPerPage])

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

  const filtersBar = (
    <SharedListFiltersBar
      left={(
        <>
          <div className="relative w-full sm:w-72">
            <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contatos..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
        </>
      )}
      right={(
        <Select value={String(itemsPerPage)} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Itens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="20">20 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  )

  const pagination = totalContacts > 0 && (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <div>
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalContacts)} a {Math.min(currentPage * itemsPerPage, totalContacts)} de {totalContacts}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <CaretLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próximo
          <CaretRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <SharedListLayout
      title="Contatos"
      subtitle="Base geral de contatos."
      actions={(
        <RequirePermission permission="contacts.create">
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Contato
          </Button>
        </RequirePermission>
      )}
      filtersBar={filtersBar}
      footer={pagination}
    >
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum contato encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-muted/50 group">
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
                  <TableCell>
                    <div className="flex gap-1">
                      <RequirePermission permission="contacts.update">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(contact)}>
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                      </RequirePermission>
                      <RequirePermission permission="contacts.delete">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(contact.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </RequirePermission>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </SharedListLayout>
  )
}
