import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useCreateLead, useDeleteLead, LeadFilters } from '@/services/leadService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MagnifyingGlass, ListDashes, SquaresFour, Globe, CaretLeft, CaretRight, Funnel } from '@phosphor-icons/react'
import { LEAD_STATUS_LABELS, LEAD_ORIGIN_LABELS, OPERATION_LABELS, Lead, OperationType } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RequirePermission } from '@/features/rbac/components/RequirePermission'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LeadActionMenu } from '../components/LeadActionMenu'
import { LeadDeleteDialog } from '../components/LeadDeleteDialog'
import { LeadEditSheet } from '../components/LeadEditSheet'
import { toast } from 'sonner'
import TagSelector from '@/components/TagSelector'
import { PageContainer } from '@/components/PageContainer'
import { SharedListLayout } from '@/components/layouts/SharedListLayout'
import { SharedListFiltersBar } from '@/components/layouts/SharedListFiltersBar'

export default function LeadsListPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [originFilter, setOriginFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const filters: LeadFilters = {
    search: search || undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
    origin: originFilter !== 'all' ? [originFilter] : undefined
  }

  const { data: leads, isLoading } = useLeads(filters)
  const createLead = useCreateLead()
  const deleteLead = useDeleteLead()

  useEffect(() => { setCurrentPage(1) }, [search, statusFilter, originFilter])

  const totalLeads = leads?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalLeads / itemsPerPage))
  const paginatedLeads = useMemo(() => leads?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [], [currentPage, itemsPerPage, leads])

  // Create/Edit/Delete states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleCreate = async () => {
    if (!newLeadName) return
    try {
      const lead = await createLead.mutateAsync({ data: { legalName: newLeadName }, userId: 'temp-user' })
      setIsCreateOpen(false)
      setNewLeadName('')
      navigate(`/leads/${lead.id}`)
    } catch { toast.error('Erro ao criar lead') }
  }

  const handleDelete = async () => {
    if (!deletingLead) return
    try {
      await deleteLead.mutateAsync(deletingLead.id)
      toast.success('Lead excluído')
      setIsDeleteOpen(false)
      setDeletingLead(null)
    } catch { toast.error('Erro ao excluir lead') }
  }

  const getPrimaryContact = (lead: Lead) => lead.contacts?.find(c => c.isPrimary) || lead.contacts?.[0]
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  return (
    <PageContainer>
      <SharedListLayout
        title="Leads"
        description="Gerencie seus prospects e oportunidades."
        isLoading={isLoading}
        isEmpty={!isLoading && totalLeads === 0}
        emptyState={{
          title: "Nenhum lead encontrado",
          description: search || statusFilter !== 'all' ? "Tente ajustar os filtros." : "Comece criando seu primeiro lead.",
          actionLabel: "Criar Lead",
          onAction: () => setIsCreateOpen(true),
          icon: <Funnel size={48} />
        }}
        primaryAction={
          <RequirePermission permission="leads.create">
            <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Lead</Button>
          </RequirePermission>
        }
        filtersBar={
          <SharedListFiltersBar
            leftContent={
              <>
                <div className="relative w-full sm:w-64">
                  <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar leads..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`w-[150px] ${statusFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger className={`w-[150px] ${originFilter !== 'all' ? 'border-primary text-primary' : ''}`}>
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Origens</SelectItem>
                    {Object.entries(LEAD_ORIGIN_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20 ml-2">
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><ListDashes /></Button>
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><SquaresFour /></Button>
                </div>
                {(statusFilter !== 'all' || originFilter !== 'all' || search) && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setOriginFilter('all'); }}>Limpar</Button>}
              </>
            }
          />
        }
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalLeads)}–{Math.min(currentPage * itemsPerPage, totalLeads)} de {totalLeads}</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[80px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><CaretLeft className="mr-2 h-4 w-4" /> Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Próximo <CaretRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        }
      >
        {viewMode === 'list' ? (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Empresa</TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Contato</TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Operação</TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Status</TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Origem</TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10">Responsável</TableHead>
                <TableHead className="sticky top-0 bg-muted/50 z-10 w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const contact = getPrimaryContact(lead)
                const owner = (lead as any).owner
                return (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50 group" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <TableCell>
                      <div className="font-medium">{lead.legalName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {lead.tradeName && <span className="text-xs text-muted-foreground">{lead.tradeName}</span>}
                        <div onClick={e => e.stopPropagation()}><TagSelector entityId={lead.id} entityType="lead" variant="minimal" /></div>
                      </div>
                    </TableCell>
                    <TableCell>{contact ? <span className="text-sm hover:underline text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/contacts/${contact.id}`) }}>{contact.name}</span> : <span className="text-xs text-muted-foreground italic">--</span>}</TableCell>
                    <TableCell>{lead.operationType ? <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">{OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType}</span> : '-'}</TableCell>
                    <TableCell><Badge variant={lead.status === 'qualified' ? 'default' : lead.status === 'disqualified' ? 'destructive' : 'secondary'}>{LEAD_STATUS_LABELS[lead.status] || lead.status}</Badge></TableCell>
                    <TableCell><div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border"><Globe className="w-3 h-3" />{LEAD_ORIGIN_LABELS[lead.origin] || lead.origin}</div></TableCell>
                    <TableCell>{owner ? <Avatar className="h-6 w-6"><AvatarImage src={owner.avatar} /><AvatarFallback className="text-[10px]">{getInitials(owner.name)}</AvatarFallback></Avatar> : '-'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}><LeadActionMenu lead={lead} onEdit={() => { setEditingLead(lead); setIsEditOpen(true); }} onDelete={() => { setDeletingLead(lead); setIsDeleteOpen(true); }} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {paginatedLeads.map(lead => (
              <Card key={lead.id} className="cursor-pointer hover:border-primary/50 transition-colors group relative" onClick={() => navigate(`/leads/${lead.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1"><CardTitle className="text-lg line-clamp-1">{lead.legalName}</CardTitle></div>
                    <div onClick={e => e.stopPropagation()}><LeadActionMenu lead={lead} onEdit={() => { setEditingLead(lead); setIsEditOpen(true); }} onDelete={() => { setDeletingLead(lead); setIsDeleteOpen(true); }} /></div>
                  </div>
                  <div className="flex flex-wrap gap-2"><Badge variant="secondary">{LEAD_STATUS_LABELS[lead.status]}</Badge></div>
                </CardHeader>
                <CardContent className="pb-3 text-sm space-y-3"><TagSelector entityId={lead.id} entityType="lead" variant="minimal" /></CardContent>
              </Card>
            ))}
          </div>
        )}
      </SharedListLayout>
      {/* Dialogs remain same */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}><DialogContent><DialogHeader><DialogTitle>Novo Lead</DialogTitle><DialogDescription>Comece adicionando o nome.</DialogDescription></DialogHeader><div className="py-4"><Label>Nome</Label><Input value={newLeadName} onChange={e => setNewLeadName(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate}>Criar</Button></DialogFooter></DialogContent></Dialog>
      <LeadEditSheet lead={editingLead} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <LeadDeleteDialog lead={deletingLead} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} isDeleting={deleteLead.isPending} />
    </PageContainer>
  )
}