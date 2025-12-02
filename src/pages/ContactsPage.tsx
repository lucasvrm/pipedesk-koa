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
import { PageContainer } from '@/components/PageContainer'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListFiltersBar } from '@/components/layouts/SharedListFiltersBar'

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
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', companyId: 'none' })

  useEffect(() => setCurrentPage(1), [search, companyFilter])

  const filteredContacts = useMemo(() => contacts?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  ) || [], [contacts, search])

  const totalContacts = filteredContacts.length
  const totalPages = Math.max(1, Math.ceil(totalContacts / itemsPerPage))
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSave = async () => {
    if (!formData.name) return toast.error("Nome é obrigatório");
    const payload = { ...formData, companyId: formData.companyId === 'none' ? null : formData.companyId }
    try {
      if (isEditOpen) {
        await updateContact.mutateAsync({ id: editingContact.id, data: payload })
        toast.success("Contato atualizado!")
      } else {
        await createContact.mutateAsync({ data: payload, userId: 'temp' })
        toast.success("Contato criado!")
      }
      setIsCreateOpen(false); setIsEditOpen(false); setFormData({ name: '', email: '', phone: '', companyId: 'none' });
    } catch { toast.error("Erro ao salvar") }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Excluir contato?")) { await deleteContact.mutateAsync(id); toast.success("Excluído"); }
  }

  return (
    <PageContainer>
      <SharedListLayout
        title="Contatos"
        description="Base geral de contatos."
        isLoading={isLoading}
        isEmpty={!isLoading && filteredContacts.length === 0}
        emptyState={{ title: "Nenhum contato", description: "Adicione contatos para começar.", actionLabel: "Novo Contato", onAction: () => { setFormData({ name: '', email: '', phone: '', companyId: 'none' }); setIsCreateOpen(true); }, icon: <User size={48} /> }}
        primaryAction={
          <RequirePermission permission="contacts.create">
            <Button onClick={() => { setFormData({ name: '', email: '', phone: '', companyId: 'none' }); setIsCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Novo Contato</Button>
          </RequirePermission>
        }
        filtersBar={
          <SharedListFiltersBar
            leftContent={
              <>
                <div className="relative w-full sm:w-72">
                  <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar contatos..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por Empresa" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todas as Empresas</SelectItem>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                {(companyFilter !== 'all' || search) && <Button variant="ghost" onClick={() => { setSearch(''); setCompanyFilter('all'); }}>Limpar</Button>}
              </>
            }
          />
        }
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalContacts)}–{Math.min(currentPage * itemsPerPage, totalContacts)} de {totalContacts}</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}><SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><CaretLeft className="mr-2 h-4 w-4" /> Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Próximo <CaretRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Nome</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Empresa</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Tipo</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Contato</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10">Criado em</TableHead>
              <TableHead className="sticky top-0 bg-muted/50 z-10 w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.map((contact) => (
              <TableRow key={contact.id} className="hover:bg-muted/50 group">
                <TableCell>
                  <div className="font-medium flex items-center gap-2"><User /> {contact.name}{contact.isPrimary && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">Principal</span>}</div>
                  {contact.role && <div className="text-xs text-muted-foreground ml-6">{contact.role}</div>}
                </TableCell>
                <TableCell>{contact.companyName ? <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/companies/${contact.companyId}`)}>{contact.companyName}</span> : <span className="text-muted-foreground italic">Sem empresa</span>}</TableCell>
                <TableCell>{contact.companyType ? <Badge variant="outline">{COMPANY_TYPE_LABELS[contact.companyType as CompanyType] || contact.companyType}</Badge> : '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    {contact.email && <div className="flex items-center gap-1"><Envelope size={12}/> {contact.email}</div>}
                    {contact.phone && <div className="flex items-center gap-1"><Phone size={12}/> {contact.phone}</div>}
                  </div>
                </TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{format(new Date(contact.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <RequirePermission permission="contacts.update"><Button variant="ghost" size="icon" onClick={() => { setEditingContact(contact); setFormData({ name: contact.name, email: contact.email || '', phone: contact.phone || '', companyId: contact.companyId || 'none' }); setIsEditOpen(true); }}><PencilSimple className="h-4 w-4" /></Button></RequirePermission>
                    <RequirePermission permission="contacts.delete"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(contact.id)}><Trash className="h-4 w-4" /></Button></RequirePermission>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsCreateOpen(false); setIsEditOpen(false); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{isEditOpen ? 'Editar' : 'Novo'}</DialogTitle><DialogDescription>Preencha os dados.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-2"><Label>Empresa</Label><Select value={formData.companyId} onValueChange={v => setFormData({...formData, companyId: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancelar</Button><Button onClick={handleSave} disabled={createContact.isPending || updateContact.isPending}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </SharedListLayout>
    </PageContainer>
  )
}