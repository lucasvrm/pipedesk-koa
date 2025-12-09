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
import { CompanyType } from '@/lib/types'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import { PageContainer } from '@/components/PageContainer'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListToolbar } from '@/components/layouts/SharedListToolbar'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { QuickActionsMenu } from '@/components/QuickActionsMenu'
import { getContactQuickActions } from '@/hooks/useQuickActions'
import { useSystemMetadata } from '@/hooks/useSystemMetadata'

export default function ContactsPage() {
  const navigate = useNavigate()
  const { getCompanyTypeByCode } = useSystemMetadata()

  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: contacts, isLoading } = useContacts(companyFilter)
  const { data: companies } = useCompanies()

  const createContact = useCreateContact()
  const deleteContact = useDeleteContact()
  const updateContact = useUpdateContact()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | 'bulk' | null>(null)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCompanyId, setNewCompanyId] = useState<string | undefined>(undefined)

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds([])
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

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedContacts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedContacts.map(c => c.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  const openDelete = (target: string | 'bulk') => {
    setDeleteTarget(target)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget === 'bulk') {
        await Promise.all(selectedIds.map(id => deleteContact.mutateAsync(id)))
        toast.success(`${selectedIds.length} contatos excluídos`)
        setSelectedIds([])
      } else {
        await deleteContact.mutateAsync(deleteTarget)
        toast.success('Contato excluído')
      }
    } catch (error) {
      toast.error('Erro ao excluir contato(s)')
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
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

  // --- Layout Sections ---

  const actions = (
    <RequirePermission permission="contacts.create">
      <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Contato
      </Button>
    </RequirePermission>
  )

  const hasFilters = companyFilter !== 'all' || search

  const filtersBar = (
    <SharedListToolbar
      searchField={
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      }
      filters={
        <div className="flex flex-wrap items-center gap-2">
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

          {hasFilters && (
            <Button variant="ghost" onClick={() => { setSearch(''); setCompanyFilter('all'); }}>Limpar</Button>
          )}
        </div>
      }
      rightContent={
        selectedIds.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => openDelete('bulk')}>
            <Trash className="mr-2 h-4 w-4" /> Excluir ({selectedIds.length})
          </Button>
        )
      }
    />
  )

  const pagination = totalContacts > 0 && (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-3 flex-wrap">
        <span>
          Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalContacts)}–{Math.min(currentPage * itemsPerPage, totalContacts)} de {totalContacts} contatos
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Linhas:</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
    <PageContainer>
      <SharedListLayout
        title="Contatos"
        description="Base geral de contatos."
        primaryAction={actions}
        filtersBar={filtersBar}
        footer={pagination}
      >
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={paginatedContacts.length > 0 && selectedIds.length === paginatedContacts.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
                paginatedContacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id)
                  return (
                    <TableRow key={contact.id} className="hover:bg-muted/50 group">
                      <TableCell>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectOne(contact.id)} />
                      </TableCell>
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
                          <Badge variant="outline">{getCompanyTypeByCode(contact.companyType as CompanyType)?.label || contact.companyType}</Badge>
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
                      <TableCell className="text-right">
                        <QuickActionsMenu
                          actions={getContactQuickActions({
                            contact,
                            navigate,
                            deleteContact: deleteContact,
                            onEdit: () => openEdit(contact),
                          })}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
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

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá {deleteTarget === 'bulk' ? `${selectedIds.length} contatos selecionados` : 'o contato selecionado'} de forma permanente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SharedListLayout>
    </PageContainer>
  )
}