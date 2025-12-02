import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useCreateLead, useDeleteLead, LeadFilters } from '@/services/leadService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, MagnifyingGlass, ListDashes, SquaresFour, Globe, CaretLeft, CaretRight } from '@phosphor-icons/react'
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
import TagSelector from '@/components/TagSelector' // Educated guess, will verify.
import { SharedListFiltersBar, SharedListLayout } from '@/features/shared/components/SharedListLayout'

export default function LeadsListPage() {
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('leads-view-mode') as 'list' | 'grid') || 'list'
  })

  useEffect(() => {
    localStorage.setItem('leads-view-mode', viewMode)
  }, [viewMode])

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

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, originFilter])

  const totalLeads = leads?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalLeads / itemsPerPage))

  const paginatedLeads = useMemo(() => {
    if (!leads) return []
    const start = (currentPage - 1) * itemsPerPage
    return leads.slice(start, start + itemsPerPage)
  }, [currentPage, itemsPerPage, leads])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')

  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleCreate = async () => {
    if (!newLeadName) return
    try {
      const lead = await createLead.mutateAsync({
        data: { legalName: newLeadName },
        userId: 'temp-user'
      })
      setIsCreateOpen(false)
      setNewLeadName('')
      navigate(`/leads/${lead.id}`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar lead')
    }
  }

  const handleDelete = async () => {
    if (!deletingLead) return
    try {
      await deleteLead.mutateAsync(deletingLead.id)
      toast.success('Lead excluído')
      setIsDeleteOpen(false)
      setDeletingLead(null)
    } catch (error) {
      toast.error('Erro ao excluir lead')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setOriginFilter('all')
  }

  const getPrimaryContact = (lead: Lead) => {
    return lead.contacts?.find(c => c.isPrimary) || lead.contacts?.[0]
  }

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  const openEdit = (lead: Lead) => {
    setEditingLead(lead)
    setIsEditOpen(true)
  }

  const openDelete = (lead: Lead) => {
    setDeletingLead(lead)
    setIsDeleteOpen(true)
  }

  const renderStatusBadge = (status: string) => (
    <Badge variant={status === 'qualified' ? 'default' : status === 'disqualified' ? 'destructive' : 'secondary'}>
      {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
    </Badge>
  )

  const renderOriginBadge = (origin: string) => (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
      <Globe className="w-3 h-3" />
      {LEAD_ORIGIN_LABELS[origin as keyof typeof LEAD_ORIGIN_LABELS] || origin}
    </div>
  )

  const actions = (
    <RequirePermission permission="leads.create">
      <Button onClick={() => setIsCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Lead
      </Button>
    </RequirePermission>
  )

  const filtersBar = (
    <SharedListFiltersBar
      left={(
        <>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Origens</SelectItem>
              {Object.entries(LEAD_ORIGIN_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter !== 'all' || originFilter !== 'all' || search) && (
            <Button variant="ghost" onClick={clearFilters}>Limpar</Button>
          )}
        </>
      )}
      right={(
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/20">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <ListDashes />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <SquaresFour />
            </Button>
          </div>

          {viewMode === 'list' && (
            <Select value={String(itemsPerPage)} onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Itens" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    />
  )

  const pagination = totalLeads > 0 && (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <div>
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalLeads)} a {Math.min(currentPage * itemsPerPage, totalLeads)} de {totalLeads}
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
      title="Leads"
      subtitle="Gerencie seus prospects e oportunidades."
      actions={actions}
      filtersBar={filtersBar}
      footer={pagination}
    >
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : paginatedLeads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10 p-8">
          Nenhum lead encontrado com os filtros atuais.
        </div>
      ) : viewMode === 'list' ? (
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const contact = getPrimaryContact(lead)
                const owner = (lead as any).owner
                return (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <TableCell>
                      <div className="font-medium">{lead.legalName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {lead.tradeName && <span className="text-xs text-muted-foreground">{lead.tradeName}</span>}
                        <div onClick={e => e.stopPropagation()}>
                          <TagSelector entityId={lead.id} entityType="lead" variant="minimal" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact ? (
                        <div
                          className="text-sm hover:underline text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/contacts/${contact.id}`)
                          }}
                        >
                          {contact.name}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.operationType ? (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                          {OPERATION_LABELS[lead.operationType as OperationType] || lead.operationType}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{renderStatusBadge(lead.status)}</TableCell>
                    <TableCell>{renderOriginBadge(lead.origin)}</TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="flex items-center gap-2" title={owner.name}>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={owner.avatar || ''} />
                            <AvatarFallback className="text-[10px]">{getInitials(owner.name)}</AvatarFallback>
                          </Avatar>
                        </div>
                      ) : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <LeadActionMenu lead={lead} onEdit={openEdit} onDelete={openDelete} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedLeads.map(lead => {
            const contact = getPrimaryContact(lead)
            const owner = (lead as any).owner
            return (
              <Card key={lead.id} className="cursor-pointer hover:border-primary/50 transition-colors group relative" onClick={() => navigate(`/leads/${lead.id}`)}>
                <CardHeader className="pb-2 space-y-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg line-clamp-1" title={lead.legalName}>{lead.legalName}</CardTitle>
                      {lead.tradeName && <p className="text-xs text-muted-foreground line-clamp-1">{lead.tradeName}</p>}
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <LeadActionMenu lead={lead} onEdit={openEdit} onDelete={openDelete} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {renderStatusBadge(lead.status)}
                    {renderOriginBadge(lead.origin)}
                  </div>
                </CardHeader>
                <CardContent className="pb-3 text-sm space-y-3">
                  <div onClick={e => e.stopPropagation()} className="min-h-[24px]">
                    <TagSelector entityId={lead.id} entityType="lead" variant="minimal" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Contato Principal</span>
                      {contact ? (
                        <div
                          className="font-medium truncate hover:text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/contacts/${contact.id}`)
                          }}
                        >
                          {contact.name}
                        </div>
                      ) : <span className="text-xs text-muted-foreground italic">Sem contato</span>}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Responsável</span>
                      {owner ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={owner.avatar} />
                            <AvatarFallback className="text-[8px]">{getInitials(owner.name)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs">{owner.name.split(' ')[0]}</span>
                        </div>
                      ) : <span>-</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Comece adicionando o nome da empresa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Razão Social / Nome</Label>
              <Input value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="Ex: Acme Corp Ltda" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newLeadName}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadEditSheet
        lead={editingLead}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <LeadDeleteDialog
        lead={deletingLead}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={deleteLead.isPending}
      />
    </SharedListLayout>
  )
}
